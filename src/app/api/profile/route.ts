import { getSessionUserId } from '@/lib/server/session';
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/responses';
import { getBestScoresForUser, claimGuestScores } from '@/lib/server/scores';
import { getUserProfile } from '@/lib/server/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return jsonError(401, 'AUTH_REQUIRED', 'Sign in to view profile');
    }

    const user = await getUserProfile(userId);
    if (!user) {
      return jsonError(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    const bests = await getBestScoresForUser(userId);
    return jsonOk({ user, bests });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    return jsonError(500, 'PROFILE_FAILED', message);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return jsonError(401, 'AUTH_REQUIRED', 'Sign in to claim guest scores');
    }

    const body = await readJsonBody<{ guestId?: string }>(request);
    if (!body.guestId) {
      return jsonError(400, 'MISSING_GUEST_ID', 'guestId is required');
    }

    const claimed = await claimGuestScores(body.guestId, userId);
    return jsonOk({ claimed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to claim guest scores';
    return jsonError(500, 'CLAIM_FAILED', message);
  }
}
