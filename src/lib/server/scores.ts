import { ensureDbSchema, getDbPool } from './db';
import { getLeaderboardRedis } from './redis';
import { computePercentile, updateLeaderboardBest, userBestsKey } from './leaderboard';
import { getTestBySlug } from '@/lib/tests/registry';
import { GIA_SLUGS, GIA_SUPERSCORE_SLUG } from '@/constants';
import type { Redis } from '@upstash/redis';

export type StoredScore = {
  id: string;
  testSlug: string;
  scoreValue: number;
  scoreUnit: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type SubmitScoreResult = {
  scoreId: string;
  personalBest: boolean;
  percentile: number | null;
  saved?: boolean;
  discardReason?: string;
};

export type SubmitScoreInput = {
  testSlug: string;
  scoreValue: number;
  scoreUnit: string;
  metadata?: Record<string, unknown>;
};

const GUEST_SCORE_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const GUEST_SCORE_CLEANUP_RETRY_INTERVAL_MS = 60 * 1000;
const GUEST_SCORE_CLEANUP_BATCH_SIZE = 2000;
const CLAIMED_GUEST_SCORE_RETENTION_DAYS = 30;
const UNCLAIMED_GUEST_SCORE_RETENTION_DAYS = 180;
const OUTLIER_HISTORY_MIN_SAMPLES = 1;
const OUTLIER_HISTORY_WINDOW = 30;
const OUTLIER_Z_THRESHOLD = 2.5;
const OUTLIER_HIGHER_MEAN_RATIO = 0.4;
const OUTLIER_HIGHER_BEST_RATIO = 0.35;
const OUTLIER_LOWER_MEAN_RATIO = 1.8;
const OUTLIER_LOWER_BEST_RATIO = 1.9;

let nextGuestScoreCleanupAt = 0;
let guestScoreCleanupInFlight: Promise<void> | null = null;

type GuestScoreCleanupRow = {
  claimed_deleted: number;
  unclaimed_deleted: number;
};

type ScoreStats = {
  sampleCount: number;
  meanScore: number | null;
  stddevScore: number | null;
};

type ScoreStatsRow = {
  sample_count: number;
  mean_score: number | null;
  stddev_score: number | null;
};

type ClaimableGuestScoreRow = {
  id: string;
  test_slug: string;
  score_value: number;
};

type BestScoreRow = {
  test_slug: string;
  best_score: number;
};

function scheduleGuestScoreCleanup(intervalMs: number): void {
  nextGuestScoreCleanupAt = Date.now() + intervalMs;
}

async function runGuestScoreCleanup(): Promise<void> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<GuestScoreCleanupRow>(
    `with claimed_deleted as (
       delete from guest_scores
       where id in (
         select id
         from guest_scores
         where claimed_by is not null
           and created_at < now() - ($1::int * interval '1 day')
         order by created_at asc
         limit $2
       )
       returning 1
     ),
     unclaimed_deleted as (
       delete from guest_scores
       where id in (
         select id
         from guest_scores
         where claimed_by is null
           and created_at < now() - ($3::int * interval '1 day')
         order by created_at asc
         limit $2
       )
       returning 1
     )
     select
       (select count(*) from claimed_deleted)::int as claimed_deleted,
       (select count(*) from unclaimed_deleted)::int as unclaimed_deleted`,
    [
      CLAIMED_GUEST_SCORE_RETENTION_DAYS,
      GUEST_SCORE_CLEANUP_BATCH_SIZE,
      UNCLAIMED_GUEST_SCORE_RETENTION_DAYS,
    ]
  );

  const row = result.rows[0];
  const claimedDeleted = row?.claimed_deleted ?? 0;
  const unclaimedDeleted = row?.unclaimed_deleted ?? 0;
  if (claimedDeleted > 0 || unclaimedDeleted > 0) {
    console.info(
      `[guest_scores] cleanup pruned claimed=${claimedDeleted} unclaimed=${unclaimedDeleted}`
    );
  }
}

function triggerGuestScoreCleanup(): void {
  const now = Date.now();
  if (now < nextGuestScoreCleanupAt) return;
  if (guestScoreCleanupInFlight) return;

  guestScoreCleanupInFlight = runGuestScoreCleanup()
    .then(() => {
      scheduleGuestScoreCleanup(GUEST_SCORE_CLEANUP_INTERVAL_MS);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'unknown error';
      console.warn(`[guest_scores] cleanup failed: ${message}`);
      scheduleGuestScoreCleanup(GUEST_SCORE_CLEANUP_RETRY_INTERVAL_MS);
    })
    .finally(() => {
      guestScoreCleanupInFlight = null;
    });
}

function isPersonalBest(direction: 'higher' | 'lower', bestScore: number | null, nextScore: number): boolean {
  if (bestScore === null) return true;
  if (direction === 'higher') return nextScore > bestScore;
  return nextScore < bestScore;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function inferAttemptCount(metadata?: Record<string, unknown>): number | null {
  if (!metadata) return null;

  const attempts = asFiniteNumber(metadata.attempts);
  if (attempts !== null) {
    return Math.max(0, Math.floor(attempts));
  }

  const correct = asFiniteNumber(metadata.correct);
  const incorrect = asFiniteNumber(metadata.incorrect);
  if (correct !== null && incorrect !== null) {
    return Math.max(0, Math.floor(correct + incorrect));
  }

  return null;
}

function shouldDiscardIdleTimedRun(
  test: { timeLimitSeconds?: number },
  input: SubmitScoreInput
): boolean {
  if (!test.timeLimitSeconds) return false;
  const attempts = inferAttemptCount(input.metadata);
  return attempts === 0;
}

function discardedIdleRunResult(): SubmitScoreResult {
  return {
    scoreId: 'discarded-idle-run',
    personalBest: false,
    percentile: null,
    saved: false,
    discardReason: 'Run was not saved because no attempts were detected.',
  };
}

function discardedOutlierRunResult(): SubmitScoreResult {
  return {
    scoreId: 'discarded-outlier-run',
    personalBest: false,
    percentile: null,
    saved: false,
    discardReason: 'Run was not saved because it was an extreme outlier versus your recent history.',
  };
}

function standardDeviationFloor(meanScore: number): number {
  return Math.max(1, Math.abs(meanScore) * 0.08);
}

function shouldDiscardHistoricalOutlier(
  direction: 'higher' | 'lower',
  previousBest: number | null,
  stats: ScoreStats,
  nextScore: number
): boolean {
  if (stats.sampleCount < OUTLIER_HISTORY_MIN_SAMPLES) return false;
  if (stats.meanScore === null) return false;

  const effectiveStddev = Math.max(stats.stddevScore ?? 0, standardDeviationFloor(stats.meanScore));
  if (!Number.isFinite(effectiveStddev) || effectiveStddev <= 0) return false;

  const z = (nextScore - stats.meanScore) / effectiveStddev;
  if (direction === 'higher') {
    const severeDropVsMean = nextScore <= stats.meanScore * OUTLIER_HIGHER_MEAN_RATIO;
    const severeDropVsBest = previousBest !== null && nextScore <= previousBest * OUTLIER_HIGHER_BEST_RATIO;
    return z <= -OUTLIER_Z_THRESHOLD && (severeDropVsMean || severeDropVsBest);
  }

  const severeRiseVsMean = nextScore >= stats.meanScore * OUTLIER_LOWER_MEAN_RATIO;
  const severeRiseVsBest = previousBest !== null && nextScore >= previousBest * OUTLIER_LOWER_BEST_RATIO;
  return z >= OUTLIER_Z_THRESHOLD && (severeRiseVsMean || severeRiseVsBest);
}

const GIA_SUBTEST_SET = new Set<string>(GIA_SLUGS);

async function computeAndUpdateGiaSuperscore(redis: Redis, userId: string): Promise<void> {
  const raw = await redis.hmget(userBestsKey(userId), ...GIA_SLUGS);
  const vals = raw as unknown as (number | null)[];
  if (!vals || vals.some((v) => v === null || v === undefined)) return;
  const superscore = (vals as number[]).reduce((sum, v) => sum + v, 0);
  await updateLeaderboardBest(redis, GIA_SUPERSCORE_SLUG, userId, superscore, 'higher');
}

async function fetchBestScore(userId: string, testSlug: string, direction: 'higher' | 'lower'): Promise<number | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const operator = direction === 'higher' ? 'max' : 'min';
  const query = `select ${operator}(score_value)::float8 as best from scores where user_id=$1 and test_slug=$2`;
  const result = await pool.query<{ best: number | null }>(query, [userId, testSlug]);
  return result.rows[0]?.best ?? null;
}

async function fetchGuestBestScore(guestId: string, testSlug: string, direction: 'higher' | 'lower'): Promise<number | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const operator = direction === 'higher' ? 'max' : 'min';
  const query = `select ${operator}(score_value)::float8 as best from guest_scores where guest_id=$1 and test_slug=$2`;
  const result = await pool.query<{ best: number | null }>(query, [guestId, testSlug]);
  return result.rows[0]?.best ?? null;
}

async function fetchRecentUserScoreStats(userId: string, testSlug: string): Promise<ScoreStats> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<ScoreStatsRow>(
    `select
       count(*)::int as sample_count,
       avg(score_value)::float8 as mean_score,
       stddev_samp(score_value)::float8 as stddev_score
     from (
       select score_value
       from scores
       where user_id=$1 and test_slug=$2
       order by created_at desc
       limit $3
     ) recent`,
    [userId, testSlug, OUTLIER_HISTORY_WINDOW]
  );
  const row = result.rows[0];
  return {
    sampleCount: row?.sample_count ?? 0,
    meanScore: row?.mean_score ?? null,
    stddevScore: row?.stddev_score ?? null,
  };
}

async function fetchRecentGuestScoreStats(guestId: string, testSlug: string): Promise<ScoreStats> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<ScoreStatsRow>(
    `select
       count(*)::int as sample_count,
       avg(score_value)::float8 as mean_score,
       stddev_samp(score_value)::float8 as stddev_score
     from (
       select score_value
       from guest_scores
       where guest_id=$1 and test_slug=$2
       order by created_at desc
       limit $3
     ) recent`,
    [guestId, testSlug, OUTLIER_HISTORY_WINDOW]
  );
  const row = result.rows[0];
  return {
    sampleCount: row?.sample_count ?? 0,
    meanScore: row?.mean_score ?? null,
    stddevScore: row?.stddev_score ?? null,
  };
}

export async function submitScoreForUser(userId: string, input: SubmitScoreInput): Promise<SubmitScoreResult> {
  triggerGuestScoreCleanup();

  const test = getTestBySlug(input.testSlug);
  if (!test) {
    throw new Error('Unknown test slug');
  }
  if (test.scoreUnit !== input.scoreUnit) {
    throw new Error('Score unit mismatch for test');
  }
  if (shouldDiscardIdleTimedRun(test, input)) {
    return discardedIdleRunResult();
  }

  await ensureDbSchema();
  const pool = getDbPool();
  const previousBest = await fetchBestScore(userId, input.testSlug, test.direction);
  const stats = await fetchRecentUserScoreStats(userId, input.testSlug);
  if (shouldDiscardHistoricalOutlier(test.direction, previousBest, stats, input.scoreValue)) {
    return discardedOutlierRunResult();
  }

  const inserted = await pool.query<{ id: string }>(
    `insert into scores (user_id, test_slug, score_value, score_unit, metadata)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [userId, input.testSlug, input.scoreValue, input.scoreUnit, input.metadata ?? null]
  );

  const personalBest = isPersonalBest(test.direction, previousBest, input.scoreValue);
  const redis = getLeaderboardRedis();
  let percentile: number | null = null;

  if (redis && test.leaderboardEnabled) {
    await updateLeaderboardBest(redis, input.testSlug, userId, input.scoreValue, test.direction);
    percentile = await computePercentile(redis, input.testSlug, input.scoreValue, test.direction);

    if (personalBest && GIA_SUBTEST_SET.has(input.testSlug)) {
      await computeAndUpdateGiaSuperscore(redis, userId);
    }
  }

  return {
    scoreId: inserted.rows[0].id,
    personalBest,
    percentile,
    saved: true,
  };
}

export async function submitScoreForGuest(guestId: string, input: SubmitScoreInput): Promise<SubmitScoreResult> {
  triggerGuestScoreCleanup();

  const test = getTestBySlug(input.testSlug);
  if (!test) {
    throw new Error('Unknown test slug');
  }
  if (test.scoreUnit !== input.scoreUnit) {
    throw new Error('Score unit mismatch for test');
  }
  if (shouldDiscardIdleTimedRun(test, input)) {
    return discardedIdleRunResult();
  }

  await ensureDbSchema();
  const pool = getDbPool();
  const previousBest = await fetchGuestBestScore(guestId, input.testSlug, test.direction);
  const stats = await fetchRecentGuestScoreStats(guestId, input.testSlug);
  if (shouldDiscardHistoricalOutlier(test.direction, previousBest, stats, input.scoreValue)) {
    return discardedOutlierRunResult();
  }

  const inserted = await pool.query<{ id: string }>(
    `insert into guest_scores (guest_id, test_slug, score_value, score_unit, metadata)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [guestId, input.testSlug, input.scoreValue, input.scoreUnit, input.metadata ?? null]
  );

  return {
    scoreId: inserted.rows[0].id,
    personalBest: isPersonalBest(test.direction, previousBest, input.scoreValue),
    percentile: null,
    saved: true,
  };
}

export async function getScoreHistoryForUser(userId: string, testSlug: string, limit = 20): Promise<StoredScore[]> {
  await ensureDbSchema();
  const pool = getDbPool();

  const result = await pool.query<{
    id: string;
    test_slug: string;
    score_value: number;
    score_unit: string;
    metadata: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `select id, test_slug, score_value::float8 as score_value, score_unit, metadata, created_at
     from scores
     where user_id=$1 and test_slug=$2
     order by created_at desc
     limit $3`,
    [userId, testSlug, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    testSlug: row.test_slug,
    scoreValue: row.score_value,
    scoreUnit: row.score_unit,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getScoreHistoryForGuest(guestId: string, testSlug: string, limit = 20): Promise<StoredScore[]> {
  await ensureDbSchema();
  const pool = getDbPool();

  const result = await pool.query<{
    id: string;
    test_slug: string;
    score_value: number;
    score_unit: string;
    metadata: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `select id, test_slug, score_value::float8 as score_value, score_unit, metadata, created_at
     from guest_scores
     where guest_id=$1 and test_slug=$2
     order by created_at desc
     limit $3`,
    [guestId, testSlug, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    testSlug: row.test_slug,
    scoreValue: row.score_value,
    scoreUnit: row.score_unit,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function claimGuestScores(guestId: string, userId: string): Promise<number> {
  triggerGuestScoreCleanup();

  await ensureDbSchema();
  const pool = getDbPool();
  const client = await pool.connect();
  const movedBestByTest = new Map<string, number>();
  const existingBestByTest = new Map<string, number>();
  let claimedCount = 0;

  try {
    await client.query('BEGIN');

    const claimable = await client.query<ClaimableGuestScoreRow>(
      `select id, test_slug, score_value::float8 as score_value
       from guest_scores
       where guest_id=$1 and claimed_by is null
       for update`,
      [guestId]
    );

    if (!claimable.rowCount) {
      await client.query('COMMIT');
      return 0;
    }

    const claimableIds = claimable.rows.map((row) => row.id);

    for (const row of claimable.rows) {
      const test = getTestBySlug(row.test_slug);
      if (!test) continue;
      const currentBest = movedBestByTest.get(row.test_slug);
      if (currentBest === undefined || isPersonalBest(test.direction, currentBest, row.score_value)) {
        movedBestByTest.set(row.test_slug, row.score_value);
      }
    }

    const impactedTestSlugs = [...movedBestByTest.keys()];
    if (impactedTestSlugs.length > 0) {
      const existing = await client.query<BestScoreRow>(
        `select s.test_slug,
                case t.direction
                  when 'higher' then max(s.score_value)
                  else min(s.score_value)
                end::float8 as best_score
         from scores s
         join test_definitions t on t.slug = s.test_slug
         where s.user_id=$1 and s.test_slug = any($2::text[])
         group by s.test_slug, t.direction`,
        [userId, impactedTestSlugs]
      );
      for (const row of existing.rows) {
        existingBestByTest.set(row.test_slug, row.best_score);
      }
    }

    await client.query(
      `insert into scores (user_id, test_slug, score_value, score_unit, metadata, created_at)
       select $2, test_slug, score_value, score_unit, metadata, created_at
       from guest_scores
       where id = any($1::uuid[])`,
      [claimableIds, userId]
    );

    const claimed = await client.query(
      `update guest_scores
       set claimed_by=$2
       where id = any($1::uuid[])`,
      [claimableIds, userId]
    );
    claimedCount = claimed.rowCount ?? 0;

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const redis = getLeaderboardRedis();
  if (!redis || claimedCount === 0) {
    return claimedCount;
  }

  let giaSubtestClaimed = false;
  for (const [testSlug, movedBest] of movedBestByTest) {
    const test = getTestBySlug(testSlug);
    if (!test?.leaderboardEnabled) continue;

    const existingBest = existingBestByTest.get(testSlug) ?? null;
    if (!isPersonalBest(test.direction, existingBest, movedBest)) continue;

    await updateLeaderboardBest(redis, testSlug, userId, movedBest, test.direction);
    if (GIA_SUBTEST_SET.has(testSlug)) giaSubtestClaimed = true;
  }

  if (giaSubtestClaimed) {
    await computeAndUpdateGiaSuperscore(redis, userId);
  }

  return claimedCount;
}

export async function getBestScoresForUser(userId: string): Promise<Array<{ testSlug: string; bestScore: number; scoreUnit: string }>> {
  await ensureDbSchema();
  const pool = getDbPool();

  const result = await pool.query<{
    test_slug: string;
    best_score: number;
    score_unit: string;
  }>(
    `select s.test_slug,
            case t.direction
              when 'higher' then max(s.score_value)
              else min(s.score_value)
            end::float8 as best_score,
            min(s.score_unit) as score_unit
     from scores s
     join test_definitions t on t.slug = s.test_slug
     where s.user_id=$1
     group by s.test_slug, t.direction
     order by s.test_slug`,
    [userId]
  );

  return result.rows.map((row) => ({
    testSlug: row.test_slug,
    bestScore: row.best_score,
    scoreUnit: row.score_unit,
  }));
}

export async function getAllScoresForCategory(userId: string, category: string): Promise<StoredScore[]> {
  await ensureDbSchema();
  const pool = getDbPool();

  const result = await pool.query<{
    id: string;
    test_slug: string;
    score_value: number;
    score_unit: string;
    metadata: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `select s.id, s.test_slug, s.score_value::float8 as score_value, s.score_unit, s.metadata, s.created_at
     from scores s
     join test_definitions t on t.slug = s.test_slug
     where s.user_id=$1 and t.category=$2
     order by s.created_at asc`,
    [userId, category]
  );

  return result.rows.map((row) => ({
    id: row.id,
    testSlug: row.test_slug,
    scoreValue: row.score_value,
    scoreUnit: row.score_unit,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getAllScoresForUser(userId: string): Promise<StoredScore[]> {
  await ensureDbSchema();
  const pool = getDbPool();

  const result = await pool.query<{
    id: string;
    test_slug: string;
    score_value: number;
    score_unit: string;
    metadata: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `select id, test_slug, score_value::float8 as score_value, score_unit, metadata, created_at
     from scores
     where user_id=$1
     order by created_at asc`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    testSlug: row.test_slug,
    scoreValue: row.score_value,
    scoreUnit: row.score_unit,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  }));
}
