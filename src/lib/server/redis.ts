import { Redis } from '@upstash/redis';
import { env } from './env';

function buildRedis(url: string | undefined, token: string | undefined): Redis | null {
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function getKvRedis(): Redis | null {
  return buildRedis(
    env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL'),
    env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN')
  );
}

export function getLeaderboardRedis(): Redis | null {
  return buildRedis(env('UPSTASH_LB_REST_URL'), env('UPSTASH_LB_REST_TOKEN'));
}
