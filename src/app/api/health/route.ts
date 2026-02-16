import { ensureDbSchema } from '@/lib/server/db';
import { jsonError, jsonOk } from '@/lib/server/responses';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await ensureDbSchema();
    return jsonOk({ ok: true, service: 'humansonly', time: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown health error';
    return jsonError(500, 'HEALTH_FAILED', message);
  }
}
