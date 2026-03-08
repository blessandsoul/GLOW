import { Queue, Worker } from 'bullmq';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { decorationsService } from '@/modules/decorations/decorations.service.js';
import { filtersService } from '@/modules/filters/filters.service.js';

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

export const decorationQueue = new Queue<Record<string, never>, void, string>(
  'decoration-replenishment',
  { connection },
);

export const decorationWorker = new Worker<Record<string, never>, void, string>(
  'decoration-replenishment',
  async () => {
    await decorationsService.replenishAllNiches();
    logger.info('Decoration replenishment cycle completed');

    await filtersService.replenishAllVariables();
    logger.info('Variable suggestion replenishment cycle completed');
  },
  { connection },
);

decorationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Decoration replenishment job failed');
});

export async function startDecorationReplenishmentSchedule(): Promise<void> {
  await decorationQueue.add(
    'replenish',
    {},
    {
      repeat: { every: 12 * 60 * 60 * 1000 }, // every 12 hours
      removeOnComplete: true,
      removeOnFail: 5,
    },
  );
  logger.info('Decoration replenishment schedule registered (every 12 hours)');
}
