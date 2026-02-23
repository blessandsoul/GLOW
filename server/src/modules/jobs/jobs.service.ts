import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/errors.js';
import { jobsRepo } from './jobs.repo.js';
import { applyWatermark } from '../../libs/watermark.js';
import { redis } from '../../libs/redis.js';
import { prisma } from '../../libs/prisma.js';
import { schedulePhotoReadyEmail } from '../../libs/queue.js';
import { logger } from '../../libs/logger.js';
import { uploadFile, validateImage } from '../../libs/storage.js';
import { processImageWithAI } from '../../libs/ai-image.js';
import { filtersService } from '../filters/filters.service.js';
import { buildPromptFromSettings, DEFAULT_PROMPT } from './prompt-builder.js';
import type { StorageFile } from '../../libs/storage.js';

export const jobsService = {
  async downloadJobResult(
    jobId: string,
    variantIndex: number,
    requestingUserId: string | undefined,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const job = await jobsRepo.findJobByIdWithUser(jobId);

    if (!job) {
      throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');
    }
    if (job.status !== 'DONE') {
      throw new ForbiddenError('Job processing not complete', 'JOB_NOT_READY');
    }

    const results = job.results as string[] | null;
    if (!results || !results[variantIndex]) {
      throw new NotFoundError('Result variant not found', 'VARIANT_NOT_FOUND');
    }

    // Determine watermark: guests always get it, FREE users get it, PRO+ users don't
    const isOwner = job.userId === requestingUserId;
    const userPlan: string = job.user?.subscription?.plan ?? 'FREE';
    const needsWatermark = !isOwner || userPlan === 'FREE';

    // Load image from local storage or external URL (backward compat)
    const resultUrl = results[variantIndex];
    let imageBuffer: Buffer;

    if (resultUrl.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), resultUrl);
      try {
        imageBuffer = await readFile(filePath);
      } catch {
        throw new NotFoundError('Result image file not found', 'IMAGE_FETCH_FAILED');
      }
    } else {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new NotFoundError('Could not fetch image', 'IMAGE_FETCH_FAILED');
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    const finalBuffer = needsWatermark
      ? await applyWatermark(imageBuffer)
      : imageBuffer;

    return {
      buffer: finalBuffer,
      filename: `glowge-${jobId}-${variantIndex}.jpg`,
    };
  },

  async createJobFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    settingsStr: string | undefined,
    userId: string | undefined,
  ): Promise<{ id: string; status: string; originalUrl: string }> {
    // Save original upload to local storage
    const storageFile: StorageFile = {
      buffer: fileBuffer,
      filename: `upload.${mimeType.split('/')[1] || 'jpg'}`,
      mimetype: mimeType,
    };
    validateImage(storageFile, 10 * 1024 * 1024); // 10MB limit for job uploads
    const originalUrl = await uploadFile(storageFile, 'jobs');

    const settings = settingsStr
      ? (() => {
          try {
            return JSON.parse(settingsStr) as object;
          } catch {
            return undefined;
          }
        })()
      : undefined;

    const job = await jobsRepo.createJob({
      userId: userId ?? undefined,
      originalUrl,
      settings,
      status: 'PROCESSING',
    });

    // Resolve prompt: filter ID lookup → settings-based → default
    let prompt: string | undefined;
    if (settings && typeof settings === 'object' && 'filterId' in settings) {
      const filterId = (settings as { filterId?: string }).filterId;
      if (filterId) {
        prompt = filtersService.getPromptById(filterId) ?? undefined;
      }
    }
    if (!prompt && settings) {
      prompt = buildPromptFromSettings(settings as Record<string, unknown>);
    }
    if (!prompt) {
      prompt = DEFAULT_PROMPT;
    }

    // Process with AI asynchronously (fire-and-forget)
    processImageWithAI(fileBuffer, prompt)
      .then(async (result) => {
        await jobsRepo.updateJob(job.id, { status: 'DONE', results: result.urls });
        if (userId) {
          schedulePhotoReadyEmail(userId, job.id).catch((err: unknown) =>
            logger.warn({ err }, 'Failed to schedule photo ready email'),
          );
        }
      })
      .catch(async (err) => {
        logger.error({ err, jobId: job.id }, 'AI image processing failed');
        await jobsRepo.updateJob(job.id, { status: 'FAILED', results: [] }).catch(() => {
          // Ignore DB update errors in background
        });
      });

    return { id: job.id, status: job.status, originalUrl: job.originalUrl };
  },

  async createGuestJob(
    fileBuffer: Buffer,
    mimeType: string,
    settingsStr: string | undefined,
    sessionId: string,
  ): Promise<{ id: string; status: string; originalUrl: string }> {
    const redisKey = `guest_demo:${sessionId}`;
    const used = await redis.get(redisKey);
    if (used) {
      throw new ForbiddenError(
        'Вы уже использовали бесплатное демо. Зарегистрируйтесь, чтобы получить 3 бесплатных кредита.',
        'GUEST_DEMO_EXHAUSTED',
      );
    }

    const job = await jobsService.createJobFromFile(fileBuffer, mimeType, settingsStr, undefined);

    // Mark session as used (expires in 24 hours)
    await redis.set(redisKey, '1', 'EX', 86400);

    return job;
  },

  async getJobById(
    id: string,
    requestingUserId: string | undefined,
  ): Promise<{ id: string; status: string; originalUrl: string; results: string[] | null; userId: string | null }> {
    const job = await jobsRepo.findById(id);
    if (!job) {
      throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');
    }

    // Security: only allow owner to see job details, or guest jobs (no userId) are accessible by job ID
    if (job.userId && job.userId !== requestingUserId) {
      throw new ForbiddenError('Access denied', 'JOB_FORBIDDEN');
    }

    return {
      id: job.id,
      status: job.status,
      originalUrl: job.originalUrl,
      results: job.results as string[] | null,
      userId: job.userId,
    };
  },

  async listUserJobs(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Awaited<ReturnType<typeof jobsRepo.findByUserId>>> {
    return jobsRepo.findByUserId(userId, page, limit);
  },

  async createBatch(
    files: Array<{ buffer: Buffer; mimeType: string }>,
    settingsStr: string | undefined,
    userId: string,
  ): Promise<{ batchId: string; jobs: Array<{ id: string; status: string }> }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: { select: { plan: true } } },
    });
    if (!user?.subscription || user.subscription.plan === 'FREE') {
      throw new ForbiddenError('Batch upload requires PRO plan', 'PRO_REQUIRED');
    }

    if (files.length === 0) {
      throw new BadRequestError('At least one file required', 'NO_FILES');
    }
    if (files.length > 10) {
      throw new BadRequestError('Maximum 10 files per batch', 'TOO_MANY_FILES');
    }

    // Validate all files upfront before saving any
    for (const file of files) {
      const storageFile: StorageFile = {
        buffer: file.buffer,
        filename: `upload.${file.mimeType.split('/')[1] || 'jpg'}`,
        mimetype: file.mimeType,
      };
      validateImage(storageFile, 10 * 1024 * 1024);
    }

    const batchId = crypto.randomUUID();
    const settings = settingsStr
      ? (() => {
          try {
            return JSON.parse(settingsStr) as object;
          } catch {
            return undefined;
          }
        })()
      : undefined;

    const jobs = await Promise.all(
      files.map(async (file) => {
        // Save original upload to local storage
        const storageFile: StorageFile = {
          buffer: file.buffer,
          filename: `upload.${file.mimeType.split('/')[1] || 'jpg'}`,
          mimetype: file.mimeType,
        };
        const originalUrl = await uploadFile(storageFile, 'jobs');

        const job = await jobsRepo.createJob({
          userId,
          originalUrl,
          settings,
          batchId,
          status: 'PROCESSING',
        });

        // Resolve prompt for batch
        let batchPrompt: string | undefined;
        if (settings && typeof settings === 'object' && 'filterId' in settings) {
          const filterId = (settings as { filterId?: string }).filterId;
          if (filterId) {
            batchPrompt = filtersService.getPromptById(filterId) ?? undefined;
          }
        }
        if (!batchPrompt && settings) {
          batchPrompt = buildPromptFromSettings(settings as Record<string, unknown>);
        }
        if (!batchPrompt) {
          batchPrompt = DEFAULT_PROMPT;
        }

        // Process with AI asynchronously (fire-and-forget)
        processImageWithAI(file.buffer, batchPrompt)
          .then(async (result) => {
            await jobsRepo.updateJob(job.id, { status: 'DONE', results: result.urls });
            if (userId) {
              schedulePhotoReadyEmail(userId, job.id).catch((err: unknown) =>
                logger.warn({ err }, 'Failed to schedule photo ready email for batch job'),
              );
            }
          })
          .catch(async (err) => {
            logger.error({ err, jobId: job.id }, 'AI image processing failed for batch job');
            await jobsRepo.updateJob(job.id, { status: 'FAILED', results: [] }).catch(() => {
              // Ignore DB update errors in background
            });
          });

        return { id: job.id, status: job.status };
      }),
    );

    return { batchId, jobs };
  },
};
