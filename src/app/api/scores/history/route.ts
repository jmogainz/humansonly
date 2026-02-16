import { getSessionUserId } from '@/lib/server/session';
import { getTestBySlug } from '@/lib/tests/registry';
import { jsonError, jsonOk } from '@/lib/server/responses';
import { getScoreHistoryForGuest, getScoreHistoryForUser } from '@/lib/server/scores';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const testSlug = url.searchParams.get('testSlug');
    const guestId = url.searchParams.get('guestId');
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') ?? '20') || 20));

    if (!testSlug) {
      return jsonError(400, 'MISSING_TEST_SLUG', 'testSlug query parameter is required');
    }

    if (!getTestBySlug(testSlug)) {
      return jsonError(404, 'UNKNOWN_TEST', 'Unknown test slug');
    }

    const userId = await getSessionUserId();
    if (userId) {
      const scores = await getScoreHistoryForUser(userId, testSlug, limit);
      return jsonOk({ testSlug, scores });
    }

    if (!guestId) {
      return jsonError(401, 'AUTH_OR_GUEST_REQUIRED', 'Sign in or provide guestId');
    }

    const scores = await getScoreHistoryForGuest(guestId, testSlug, limit);
    return jsonOk({ testSlug, scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load score history';
    return jsonError(500, 'HISTORY_FAILED', message);
  }
}
