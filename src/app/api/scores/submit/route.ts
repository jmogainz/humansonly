import { getSessionUserId } from '@/lib/server/session';
import { getTestBySlug } from '@/lib/tests/registry';
import { jsonError, jsonOk, readJsonBody } from '@/lib/server/responses';
import { claimGuestScores, submitScoreForGuest, submitScoreForUser } from '@/lib/server/scores';
import type { SubmitScoreRequest } from '@/lib/api/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<SubmitScoreRequest>(request);
    if (!body.testSlug) {
      return jsonError(400, 'MISSING_TEST_SLUG', 'testSlug is required');
    }

    const test = getTestBySlug(body.testSlug);
    if (!test) {
      return jsonError(404, 'UNKNOWN_TEST', 'Unknown test slug');
    }

    if (!isFiniteNumber(body.scoreValue)) {
      return jsonError(400, 'INVALID_SCORE', 'scoreValue must be a number');
    }

    if (body.scoreUnit !== test.scoreUnit) {
      return jsonError(400, 'INVALID_UNIT', 'scoreUnit does not match test requirements');
    }

    const userId = await getSessionUserId();
    if (userId) {
      if (body.guestId) {
        await claimGuestScores(body.guestId, userId);
      }
      const result = await submitScoreForUser(userId, {
        testSlug: body.testSlug,
        scoreValue: body.scoreValue,
        scoreUnit: body.scoreUnit,
        metadata: body.metadata,
      });
      return jsonOk(result);
    }

    if (!body.guestId) {
      return jsonError(401, 'AUTH_OR_GUEST_REQUIRED', 'Sign in or provide guestId');
    }

    const result = await submitScoreForGuest(body.guestId, {
      testSlug: body.testSlug,
      scoreValue: body.scoreValue,
      scoreUnit: body.scoreUnit,
      metadata: body.metadata,
    });

    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit score';
    return jsonError(500, 'SUBMIT_FAILED', message);
  }
}
