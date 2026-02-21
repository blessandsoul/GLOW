import { Queue, Worker } from 'bullmq';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { sendEmail } from '@/libs/email.js';
import * as templates from '@/libs/email-templates.js';
import { prisma } from '@/libs/prisma.js';

export type EmailJobType = 'WELCOME' | 'PHOTO_READY' | 'DAY3_FOLLOWUP' | 'DAY7_UPGRADE';

export interface EmailJobData {
  type: EmailJobType;
  userId: string;
  jobId?: string;
}

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

export const emailQueue = new Queue<EmailJobData, void, string>('emails', { connection });

export const emailWorker = new Worker<EmailJobData, void, string>(
  'emails',
  async (job) => {
    const user = await prisma.user.findUnique({
      where: { id: job.data.userId },
      select: { email: true, firstName: true, credits: true },
    });
    if (!user) return;

    switch (job.data.type) {
      case 'WELCOME':
        await sendEmail(
          user.email,
          'Добро пожаловать в Glow.GE! 🌟',
          templates.welcomeEmailHtml(user.firstName, env.APP_URL),
        );
        break;
      case 'PHOTO_READY':
        if (job.data.jobId) {
          await sendEmail(
            user.email,
            'Ваше фото готово!',
            templates.photoReadyEmailHtml(user.firstName, job.data.jobId, env.APP_URL),
          );
        }
        break;
      case 'DAY3_FOLLOWUP':
        await sendEmail(
          user.email,
          'Как оценили клиенты?',
          templates.day3FollowupHtml(user.firstName, env.APP_URL),
        );
        break;
      case 'DAY7_UPGRADE':
        if (user.credits === 0) {
          await sendEmail(
            user.email,
            'Специальное предложение — 50% скидка',
            templates.day7UpgradeOfferHtml(user.firstName, env.APP_URL),
          );
        }
        break;
    }
  },
  { connection },
);

emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, type: job.data.type }, 'Email job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Email job failed');
});

export async function scheduleEmailSequence(userId: string): Promise<void> {
  await emailQueue.add('welcome', { type: 'WELCOME', userId });
  await emailQueue.add('day3', { type: 'DAY3_FOLLOWUP', userId }, { delay: 3 * 24 * 60 * 60 * 1000 });
  await emailQueue.add('day7', { type: 'DAY7_UPGRADE', userId }, { delay: 7 * 24 * 60 * 60 * 1000 });
}

export async function schedulePhotoReadyEmail(userId: string, jobId: string): Promise<void> {
  await emailQueue.add('photo-ready', { type: 'PHOTO_READY', userId, jobId }, { delay: 5000 });
}
