import { getTestBySlug } from '@/lib/tests/registry';
import type { LeaderboardEntry } from '@/lib/tests/types';
import { mapDisplayNames } from './users';
import { denormalizeScore, leaderboardKey } from './leaderboard';
import { getLeaderboardRedis } from './redis';

function parseMember(member: string): { type: 'user' | 'guest'; id: string } | null {
  const [type, id] = member.split(':');
  if (!id) return null;
  if (type !== 'user' && type !== 'guest') return null;
  return { type, id };
}

export async function getTopLeaderboardEntries(testSlug: string, limit = 100, offset = 0): Promise<LeaderboardEntry[]> {
  const test = getTestBySlug(testSlug);
  if (!test?.leaderboardEnabled) return [];

  const redis = getLeaderboardRedis();
  if (!redis) return [];

  const raw = await redis.zrange<(string | number)[]>(leaderboardKey(testSlug), offset, offset + limit - 1, {
    rev: true,
    withScores: true,
  });

  const members: string[] = [];
  const scores: number[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    members.push(String(raw[i]));
    scores.push(Number(raw[i + 1]));
  }

  const parsed = members.map(parseMember);
  const userIds = parsed
    .filter((value): value is { type: 'user'; id: string } => value?.type === 'user')
    .map((value) => value.id);
  const names = await mapDisplayNames(userIds);

  return members.map((member, index) => {
    const decoded = parsed[index];
    const normalized = scores[index] ?? 0;
    const scoreValue = denormalizeScore(normalized, test.direction);

    if (decoded?.type === 'user') {
      const user = names.get(decoded.id);
      return {
        rank: offset + index + 1,
        userId: decoded.id,
        displayName: user?.displayName ?? 'Player',
        imageUrl: user?.imageUrl ?? null,
        scoreValue,
        scoreUnit: test.scoreUnit,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      rank: offset + index + 1,
      userId: member,
      displayName: 'Guest',
      imageUrl: null,
      scoreValue,
      scoreUnit: test.scoreUnit,
      createdAt: new Date().toISOString(),
    };
  });
}

export async function getUserRankForTest(testSlug: string, userId: string): Promise<number | null> {
  const test = getTestBySlug(testSlug);
  if (!test?.leaderboardEnabled) return null;
  const redis = getLeaderboardRedis();
  if (!redis) return null;

  const rank = await redis.zrevrank(leaderboardKey(testSlug), `user:${userId}`);
  if (rank === null || rank === undefined) return null;
  return Number(rank) + 1;
}

export async function getEntriesAroundUser(
  testSlug: string,
  userId: string,
  radius = 5
): Promise<{ rank: number; entries: LeaderboardEntry[] }> {
  const rank = await getUserRankForTest(testSlug, userId);
  if (!rank) {
    return { rank: 0, entries: [] };
  }

  const start = Math.max(0, rank - 1 - radius);
  const end = rank - 1 + radius;
  const entries = await getTopLeaderboardEntries(testSlug, end - start + 1, start);
  return {
    rank,
    entries: entries.map((entry) => ({
      ...entry,
      isCurrentUser: entry.userId === userId,
    })),
  };
}
