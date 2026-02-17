import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/server/session';
import { ensureDbSchema, getDbPool } from '@/lib/server/db';
import { jsonError, readJsonBody } from '@/lib/server/responses';
import { DISPLAY_NAME_MAX_LEN, DISPLAY_NAME_MIN_LEN } from '@/lib/server/displayNameRules';
import { isInappropriateDisplayName, isValidDisplayName, normalizeDisplayName } from '@/lib/server/displayNameValidation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Body = {
  displayName?: string;
};

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return jsonError(401, 'AUTH_REQUIRED', 'Sign in to change your name.');
  }

  try {
    await ensureDbSchema();
    const pool = getDbPool();

    const body = await readJsonBody<Body>(request).catch(() => ({} as Body));
    const requested = body.displayName ? normalizeDisplayName(body.displayName) : null;

    if (!requested) {
      return jsonError(400, 'INVALID_NAME', 'Display name is required.');
    }

    if (!isValidDisplayName(requested)) {
      return jsonError(400, 'INVALID_NAME', `Display name must be ${DISPLAY_NAME_MIN_LEN}\u2013${DISPLAY_NAME_MAX_LEN} letters/numbers (any language).`);
    }

    const currentRes = await pool.query<{ name: string | null; display_name_updated_at: string | Date | null }>(
      'select name, display_name_updated_at from users where id=$1',
      [userId]
    );

    if (!currentRes.rowCount) {
      return jsonError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const currentName = currentRes.rows[0]?.name ?? null;
    const lastChangedRaw = currentRes.rows[0]?.display_name_updated_at ?? null;

    if (requested === currentName) {
      return NextResponse.json({ displayName: currentName }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Check if name is taken
    const takenResult = await pool.query(
      `select 1
       from users
       where name is not null
         and lower(name)=lower($1)
         and id <> $2
       limit 1`,
      [requested, userId]
    );

    if ((takenResult.rowCount ?? 0) > 0) {
      return jsonError(409, 'NAME_TAKEN', 'That name is already taken.');
    }

    if (isInappropriateDisplayName(requested)) {
      return jsonError(400, 'INAPPROPRIATE_NAME', 'Display name isn\u2019t allowed.');
    }

    // Check rate limit (once a month)
    if (lastChangedRaw) {
      const lastChanged = lastChangedRaw instanceof Date ? lastChangedRaw : new Date(lastChangedRaw);
      if (!Number.isNaN(lastChanged.getTime())) {
        const nextAllowed = new Date(lastChanged.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (Date.now() < nextAllowed.getTime()) {
          const nextDate = nextAllowed.toISOString().slice(0, 10);
          return jsonError(429, 'NAME_CHANGE_LIMIT', `You can change your name again on ${nextDate}.`);
        }
      }
    }

    await pool.query(
      'update users set name=$2, display_name_updated_at=now(), updated_at=now() where id=$1',
      [userId, requested]
    );

    return NextResponse.json({ displayName: requested }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505') {
      return jsonError(409, 'NAME_TAKEN', 'That name is already taken.');
    }
    const message = err instanceof Error ? err.message : 'Failed to change name';
    return jsonError(500, 'CHANGE_FAILED', message);
  }
}
