import { Queue, Worker } from 'bullmq';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { waitlistService } from '@/modules/waitlist/waitlist.service.js';

// Parse REDIS_URL into connection options for BullMQ
function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string; username?: string } {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: url.port ? parseInt(url.port, 10) : 6379,
      ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
      ...(url.username && url.username !== 'default' ? { username: url.username } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = parseRedisUrl(env.REDIS_URL);

export const waitlistQueue = new Queue<Record<string, never>, void, string>('waitlist-expiry', {
  connection,
});

export const waitlistWorker = new Worker<Record<string, never>, void, string>(
  'waitlist-expiry',
  async () => {
    const count = await waitlistService.expireStale(new Date());
    if (count > 0) logger.info({ count }, 'Waitlist expiry sweep completed');
  },
  { connection },
);

waitlistWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Waitlist expiry job failed');
});

export async function startWaitlistExpirySchedule(): Promise<void> {
  await waitlistQueue.add(
    'expire-stale',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // hourly
      removeOnComplete: true,
      removeOnFail: 5,
    },
  );
  logger.info('Waitlist expiry schedule registered (hourly)');
}
