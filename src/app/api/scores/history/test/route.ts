import { getSessionUserId } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/responses';
import { getScoreHistoryForGuest, getScoreHistoryForUser } from '@/lib/server/scores';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_LIMIT = 5000;

function parseLimit(raw: string | null): number {
  if (!raw) return MAX_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return MAX_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testSlug = searchParams.get('testSlug');
    if (!testSlug) {
      return jsonError(400, 'MISSING_TEST_SLUG', 'testSlug is required');
    }

    const limit = parseLimit(searchParams.get('limit'));
    const userId = await getSessionUserId();
    if (userId) {
      const scores = await getScoreHistoryForUser(userId, testSlug, limit);
      return jsonOk({ testSlug, scores });
    }

    const guestId = searchParams.get('guestId');
    if (!guestId) {
      return jsonError(401, 'AUTH_OR_GUEST_REQUIRED', 'Sign in or provide guestId');
    }

    const scores = await getScoreHistoryForGuest(guestId, testSlug, limit);
    return jsonOk({ testSlug, scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load test history';
    return jsonError(500, 'TEST_HISTORY_FAILED', message);
  }
}
