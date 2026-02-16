export type EnvName =
  | 'DB_URL'
  | 'KV_REST_API_URL'
  | 'KV_REST_API_TOKEN'
  | 'UPSTASH_REDIS_REST_URL'
  | 'UPSTASH_REDIS_REST_TOKEN'
  | 'UPSTASH_LB_REST_URL'
  | 'UPSTASH_LB_REST_TOKEN'
  | 'AUTH_SECRET'
  | 'AUTH_URL'
  | 'NEXTAUTH_SECRET'
  | 'NEXTAUTH_URL'
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
  | 'APPLE_CLIENT_ID'
  | 'APPLE_CLIENT_SECRET'
  | 'APPLE_TEAM_ID'
  | 'APPLE_KEY_ID'
  | 'APPLE_PRIVATE_KEY'
  | 'CRON_SECRET'
  | 'NEXT_PUBLIC_ENV'
  | 'ADMIN_SECRET'
  | 'VERCEL_STAGING_DOMAIN';

export function env(name: EnvName): string | undefined {
  return process.env[name];
}

export function requireEnv(name: EnvName): string {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function isProdEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}
