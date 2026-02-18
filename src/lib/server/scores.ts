import { ensureDbSchema, getDbPool } from './db';
import { getLeaderboardRedis } from './redis';
import { computePercentile, updateLeaderboardBest } from './leaderboard';
import { getTestBySlug } from '@/lib/tests/registry';

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

let nextGuestScoreCleanupAt = 0;
let guestScoreCleanupInFlight: Promise<void> | null = null;

type GuestScoreCleanupRow = {
  claimed_deleted: number;
  unclaimed_deleted: number;
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

export async function submitScoreForUser(userId: string, input: SubmitScoreInput): Promise<SubmitScoreResult> {
  triggerGuestScoreCleanup();

  const test = getTestBySlug(input.testSlug);
  if (!test) {
    throw new Error('Unknown test slug');
  }
  if (test.scoreUnit !== input.scoreUnit) {
    throw new Error('Score unit mismatch for test');
  }

  await ensureDbSchema();
  const pool = getDbPool();
  const previousBest = await fetchBestScore(userId, input.testSlug, test.direction);

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
  }

  return {
    scoreId: inserted.rows[0].id,
    personalBest,
    percentile,
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

  await ensureDbSchema();
  const pool = getDbPool();
  const previousBest = await fetchGuestBestScore(guestId, input.testSlug, test.direction);

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

  const result = await pool.query(
    `with moved as (
       insert into scores (user_id, test_slug, score_value, score_unit, metadata, created_at)
       select $2, test_slug, score_value, score_unit, metadata, created_at
       from guest_scores
       where guest_id=$1 and claimed_by is null
       returning 1
     )
     update guest_scores
     set claimed_by=$2
     where guest_id=$1 and claimed_by is null
     returning 1`,
    [guestId, userId]
  );

  return result.rowCount ?? 0;
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
