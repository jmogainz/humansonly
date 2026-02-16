import { Pool } from 'pg';
import { env, requireEnv } from './env';

declare global {
  var __humansOnlyDbPool: Pool | undefined;
  var __humansOnlySchemaEnsured: boolean | undefined;
}

export function getDbPool(): Pool {
  if (global.__humansOnlyDbPool) return global.__humansOnlyDbPool;
  const pool = new Pool({
    connectionString: requireEnv('DB_URL'),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  global.__humansOnlyDbPool = pool;
  return pool;
}

export async function ensureDbSchema(): Promise<void> {
  if (global.__humansOnlySchemaEnsured) return;
  if (!env('DB_URL')) {
    throw new Error('DB_URL is not set');
  }
  const pool = getDbPool();
  try {
    await pool.query('select 1 from schema_version limit 1');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Database schema not initialized. Run migrations first. (${message})`);
  }
  global.__humansOnlySchemaEnsured = true;
}
