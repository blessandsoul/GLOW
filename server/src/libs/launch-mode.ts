import { redis } from '@/libs/redis.js';
import { env } from '@/config/env.js';
import { prisma } from '@/libs/prisma.js';
import { ForbiddenError } from '@/shared/errors/errors.js';

const KEY_PREFIX = 'launch_daily';
const TTL_SECONDS = 86400; // 24 hours

function redisKey(userId: string): string {
  return `${KEY_PREFIX}:${userId}`;
}

export function isLaunchMode(): boolean {
  return env.LAUNCH_MODE;
}

async function fetchReferralBonus(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralBonus: true },
  });
  return user?.referralBonus ?? 0;
}

async function decrementReferralBonus(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { referralBonus: { decrement: 1 } },
  });
}

export async function getDailyUsage(
  userId: string,
): Promise<{ used: number; limit: number; bonusRemaining: number; resetsAt: string }> {
  const key = redisKey(userId);
  const [value, ttl, bonusRemaining] = await Promise.all([
    redis.get(key),
    redis.ttl(key),
    fetchReferralBonus(userId),
  ]);

  const used = value ? parseInt(value, 10) : 0;
  const limit = env.LAUNCH_DAILY_LIMIT;

  // Heal orphaned keys: if key exists without TTL, set one
  if (value && ttl === -1) {
    await redis.expire(key, TTL_SECONDS);
  }

  const remainingTtl = ttl > 0 ? ttl : TTL_SECONDS;
  const resetsAt = new Date(Date.now() + remainingTtl * 1000).toISOString();

  return { used, limit, bonusRemaining, resetsAt };
}

export async function incrementDailyUsage(
  userId: string,
): Promise<{ used: number; limit: number; bonusRemaining: number; resetsAt: string }> {
  const key = redisKey(userId);
  const bonusRemaining = await fetchReferralBonus(userId);
  const currentUsed = await redis.get(key);
  const currentCount = currentUsed ? parseInt(currentUsed, 10) : 0;
  const limit = env.LAUNCH_DAILY_LIMIT;

  let used: number;
  let newBonusRemaining = bonusRemaining;

  if (currentCount >= limit && bonusRemaining > 0) {
    // Over daily limit but has bonus — consume one bonus generation
    await decrementReferralBonus(userId);
    newBonusRemaining = bonusRemaining - 1;
    used = currentCount; // Don't increment Redis counter
  } else {
    // Normal daily usage — increment Redis counter
    used = await redis.incr(key);
  }

  // Ensure TTL always exists — set on first increment or heal if missing
  const ttl = await redis.ttl(key);
  if (ttl <= 0) {
    await redis.expire(key, TTL_SECONDS);
  }

  const remainingTtl = ttl > 0 ? ttl : TTL_SECONDS;
  const resetsAt = new Date(Date.now() + remainingTtl * 1000).toISOString();

  return { used, limit, bonusRemaining: newBonusRemaining, resetsAt };
}

export async function checkDailyLimit(userId: string): Promise<void> {
  const { used, limit, bonusRemaining, resetsAt } = await getDailyUsage(userId);

  if (used >= limit && bonusRemaining <= 0) {
    throw new ForbiddenError(
      `Daily generation limit reached (${limit}). Resets at ${resetsAt}`,
      'DAILY_LIMIT_REACHED',
    );
  }
}
