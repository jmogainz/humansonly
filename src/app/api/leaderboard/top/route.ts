import { getTestBySlug } from '@/lib/tests/registry';
import { getTopLeaderboardEntries } from '@/lib/server/leaderboardData';
import { jsonError, jsonOk } from '@/lib/server/responses';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const testSlug = url.searchParams.get('testSlug');
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') ?? '25') || 25));
    const offset = Math.max(0, Number(url.searchParams.get('offset') ?? '0') || 0);

    if (!testSlug) {
      return jsonError(400, 'MISSING_TEST_SLUG', 'testSlug query parameter is required');
    }

    const test = getTestBySlug(testSlug);
    if (!test) {
      return jsonError(404, 'UNKNOWN_TEST', 'Unknown test slug');
    }

    if (!test.leaderboardEnabled) {
      return jsonOk({ testSlug, entries: [] });
    }

    const entries = await getTopLeaderboardEntries(testSlug, limit, offset);
    return jsonOk({ testSlug, entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load leaderboard';
    return jsonError(500, 'LEADERBOARD_TOP_FAILED', message);
  }
}
