import type { Redis } from '@upstash/redis';
import type { ScoreDirection } from '@/lib/tests/types';

export function leaderboardKey(testSlug: string): string {
  return `leaderboard:${testSlug}`;
}

export function userBestsKey(userId: string): string {
  return `user:${userId}:bests`;
}

export function histogramKey(testSlug: string): string {
  return `stats:${testSlug}:histogram`;
}

export function normalizeScore(score: number, direction: ScoreDirection): number {
  if (direction === 'higher') return score;
  return -score;
}

export function denormalizeScore(score: number, direction: ScoreDirection): number {
  if (direction === 'higher') return score;
  return -score;
}

export async function updateLeaderboardBest(
  redis: Redis,
  testSlug: string,
  userId: string,
  scoreValue: number,
  direction: ScoreDirection
): Promise<void> {
  const key = leaderboardKey(testSlug);
  const normalized = normalizeScore(scoreValue, direction);
  const member = `user:${userId}`;

  const current = await redis.zscore(key, member);
  if (current === null || normalized > current) {
    await redis.zadd(key, {
      score: normalized,
      member,
    });
  }

  await redis.hset(userBestsKey(userId), {
    [testSlug]: scoreValue,
  });

  const bucket = Math.floor(scoreValue / 10) * 10;
  await redis.hincrby(histogramKey(testSlug), String(bucket), 1);
}

export async function computePercentile(
  redis: Redis,
  testSlug: string,
  scoreValue: number,
  direction: ScoreDirection
): Promise<number | null> {
  const key = leaderboardKey(testSlug);
  const total = await redis.zcard(key);
  if (!total) return null;

  const normalized = normalizeScore(scoreValue, direction);
  // "Better than X%" means: how many scores are worse than this score.
  const worse = await redis.zcount(key, '-inf', `(${normalized}`);
  const percentile = (worse / total) * 100;
  return Math.max(0, Math.min(100, percentile));
}
