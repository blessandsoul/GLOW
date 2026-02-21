import Redis from 'ioredis';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';

let redisConnected = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 500, 3000);
  },
});

redis.on('connect', () => {
  redisConnected = true;
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  if (redisConnected) {
    logger.error({ err }, 'Redis connection error');
  }
  // Suppress repeated errors when Redis is unavailable
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redisConnected) {
    await redis.quit();
    logger.info('Redis disconnected');
  }
}
