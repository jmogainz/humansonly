import { getSessionUserId } from '@/lib/server/session';
import { getTestBySlug } from '@/lib/tests/registry';
import { getEntriesAroundUser, LEADERBOARD_UNAVAILABLE_ERROR } from '@/lib/server/leaderboardData';
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

    if (!test.leaderboardEnabled) {
      return jsonOk({ testSlug, rank: 0, entries: [] });
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return jsonError(401, 'AUTH_REQUIRED', 'Sign in to view leaderboard around you');
    }

    const around = await getEntriesAroundUser(testSlug, userId, 5);
    return jsonOk({ testSlug, ...around });
  } catch (error) {
    if (error instanceof Error && error.message === LEADERBOARD_UNAVAILABLE_ERROR) {
      return jsonError(503, 'LEADERBOARD_UNAVAILABLE', 'Leaderboard service is currently unavailable');
    }
    const message = error instanceof Error ? error.message : 'Failed to load around-me leaderboard';
    return jsonError(500, 'LEADERBOARD_AROUND_FAILED', message);
  }
}
