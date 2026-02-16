import { getSessionUserId } from '@/lib/server/session';
import { getTestBySlug } from '@/lib/tests/registry';
import { getEntriesAroundUser, getUserRankForTest } from '@/lib/server/leaderboardData';
import { jsonError, jsonOk } from '@/lib/server/responses';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const testSlug = url.searchParams.get('testSlug');

    if (!testSlug) {
      return jsonError(400, 'MISSING_TEST_SLUG', 'testSlug query parameter is required');
    }

    const test = getTestBySlug(testSlug);
    if (!test) {
      return jsonError(404, 'UNKNOWN_TEST', 'Unknown test slug');
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return jsonError(401, 'AUTH_REQUIRED', 'Sign in to access your rank');
    }

    const rank = await getUserRankForTest(testSlug, userId);
    const around = await getEntriesAroundUser(testSlug, userId, 2);
    return jsonOk({ testSlug, rank, entries: around.entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load current user leaderboard data';
    return jsonError(500, 'LEADERBOARD_ME_FAILED', message);
  }
}
