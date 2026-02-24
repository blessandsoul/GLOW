import { Queue, Worker } from 'bullmq';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { subscriptionsService } from '@/modules/subscriptions/subscriptions.service.js';

// Parse REDIS_URL into host/port for BullMQ (avoids ioredis version mismatch)
function parseRedisUrl(redisUrl: string): { host: string; port: number } {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: url.port ? parseInt(url.port, 10) : 6379,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = parseRedisUrl(env.REDIS_URL);

export const subscriptionQueue = new Queue<Record<string, never>, void, string>(
  'subscription-renewals',
  { connection },
);

export const subscriptionWorker = new Worker<Record<string, never>, void, string>(
  'subscription-renewals',
  async () => {
    const result = await subscriptionsService.processRenewals();
    logger.info(
      { renewed: result.renewed, expired: result.expired },
      'Subscription renewal cycle completed',
    );
  },
  { connection },
);

subscriptionWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Subscription renewal job failed');
});

export async function startSubscriptionRenewalSchedule(): Promise<void> {
  await subscriptionQueue.add(
    'renew',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // every hour
      removeOnComplete: true,
      removeOnFail: 5,
    },
  );
  logger.info('Subscription renewal schedule registered (every 1 hour)');
}
