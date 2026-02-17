import { getSessionUserId } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/responses';
import { getAllScoresForCategory, getAllScoresForUser } from '@/lib/server/scores';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const userId = await getSessionUserId();
    if (!userId) {
      return jsonError(401, 'AUTH_REQUIRED', 'Sign in to view history');
    }

    const scores = category
      ? await getAllScoresForCategory(userId, category)
      : await getAllScoresForUser(userId);
    return jsonOk({ scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load scores';
    return jsonError(500, 'HISTORY_FAILED', message);
  }
}
