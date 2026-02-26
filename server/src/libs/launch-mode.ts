import { redis } from '@/libs/redis.js';
import { env } from '@/config/env.js';
import { ForbiddenError } from '@/shared/errors/errors.js';

const KEY_PREFIX = 'launch_daily';
const TTL_SECONDS = 86400; // 24 hours

function redisKey(userId: string): string {
  return `${KEY_PREFIX}:${userId}`;
}

export function isLaunchMode(): boolean {
  return env.LAUNCH_MODE;
}

export async function getDailyUsage(
  userId: string,
): Promise<{ used: number; limit: number; resetsAt: string }> {
  const key = redisKey(userId);
  const [value, ttl] = await Promise.all([redis.get(key), redis.ttl(key)]);

  const used = value ? parseInt(value, 10) : 0;
  const limit = env.LAUNCH_DAILY_LIMIT;
  const remainingTtl = ttl > 0 ? ttl : TTL_SECONDS;
  const resetsAt = new Date(Date.now() + remainingTtl * 1000).toISOString();

  return { used, limit, resetsAt };
}

export async function incrementDailyUsage(
  userId: string,
): Promise<{ used: number; limit: number; resetsAt: string }> {
  const key = redisKey(userId);
  const used = await redis.incr(key);

  // Set TTL on first increment (when value becomes 1)
  if (used === 1) {
    await redis.expire(key, TTL_SECONDS);
  }

  const ttl = await redis.ttl(key);
  const remainingTtl = ttl > 0 ? ttl : TTL_SECONDS;
  const resetsAt = new Date(Date.now() + remainingTtl * 1000).toISOString();
  const limit = env.LAUNCH_DAILY_LIMIT;

  return { used, limit, resetsAt };
}

export async function checkDailyLimit(userId: string): Promise<void> {
  const { used, limit, resetsAt } = await getDailyUsage(userId);

  if (used >= limit) {
    throw new ForbiddenError(
      `Daily generation limit reached (${limit}). Resets at ${resetsAt}`,
      'DAILY_LIMIT_REACHED',
    );
  }
}
