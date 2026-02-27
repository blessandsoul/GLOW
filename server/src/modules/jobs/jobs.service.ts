import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/errors.js';
import { jobsRepo } from './jobs.repo.js';
import { applyWatermark, applyBranding } from '../../libs/watermark.js';
import { brandingRepo } from '../branding/branding.repo.js';
import { redis } from '../../libs/redis.js';
import { prisma } from '../../libs/prisma.js';
import { schedulePhotoReadyEmail } from '../../libs/queue.js';
import { logger } from '../../libs/logger.js';
import { uploadFile, validateImage } from '../../libs/storage.js';
import { processImageWithAI } from '../../libs/ai-image.js';
import { filtersService } from '../filters/filters.service.js';
import { creditsService } from '../credits/credits.service.js';
import { creditsRepo } from '../credits/credits.repo.js';
import { buildPromptFromSettings, DEFAULT_PROMPT } from './prompt-builder.js';
import { getPlanConfig } from '../subscriptions/subscriptions.constants.js';
import { isLaunchMode, checkDailyLimit, incrementDailyUsage, getDailyUsage } from '../../libs/launch-mode.js';
import { env } from '../../config/env.js';
import type { StorageFile } from '../../libs/storage.js';

export const jobsService = {
  async downloadJobResult(
    jobId: string,
    variantIndex: number,
    requestingUserId: string | undefined,
    branded: boolean,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
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

    // Master watermark switch — when disabled, skip ALL watermarks
    const watermarkEnabled = env.WATERMARK_ENABLED;

    // Determine Glow.GE watermark: guests always get it, FREE users get it, PRO+ users don't
    // In launch mode: no watermark for anyone
    const isOwner = job.userId === requestingUserId;
    const userPlan: string = job.user?.subscription?.plan ?? 'FREE';
    const needsGlowWatermark = watermarkEnabled && !isLaunchMode() && (!isOwner || userPlan === 'FREE');

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

    let finalBuffer = imageBuffer;
    let wasProcessed = false;

    // Apply custom branding if requested, watermarks enabled, and user has an active branding profile
    if (watermarkEnabled && branded && job.userId) {
      const branding = await brandingRepo.findByUserId(job.userId);
      if (branding?.isActive && branding.displayName && branding.instagramHandle) {
        finalBuffer = await applyBranding(finalBuffer, {
          displayName: branding.displayName,
          instagramHandle: branding.instagramHandle,
          logoUrl: branding.logoUrl,
          primaryColor: branding.primaryColor,
          watermarkStyle: branding.watermarkStyle,
          watermarkOpacity: branding.watermarkOpacity,
        });
        wasProcessed = true;
      }
    }

    // Apply Glow.GE watermark for FREE/guest users (separate from custom branding)
    if (needsGlowWatermark) {
      finalBuffer = await applyWatermark(finalBuffer);
      wasProcessed = true;
    }

    // Determine content type: if image was processed through Sharp, use configured format; otherwise preserve original
    const downloadFormat = wasProcessed ? env.IMAGE_DOWNLOAD_FORMAT : 'original';
    const ext = resultUrl.endsWith('.png') ? 'png' : resultUrl.endsWith('.webp') ? 'webp' : 'jpg';
    const contentType = downloadFormat === 'png' ? 'image/png'
      : downloadFormat === 'jpeg' ? 'image/jpeg'
      : ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';
    const fileExt = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';

    return {
      buffer: finalBuffer,
      filename: `glowge-${jobId}-${variantIndex}.${fileExt}`,
      contentType,
    };
  },

  async createJobFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    settingsStr: string | undefined,
    userId: string | undefined,
    processingType: string = 'ENHANCE',
  ): Promise<{ id: string; status: string; originalUrl: string; creditsRemaining?: number; dailyUsage?: { used: number; limit: number; resetsAt: string } }> {
    const creditCost = creditsService.getCost(processingType);

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

    // In launch mode, check daily limit before creating job
    if (isLaunchMode() && userId) {
      await checkDailyLimit(userId);
    }

    // In normal mode, pre-check credit balance before creating the job
    // to avoid orphaned PROCESSING jobs when credits are insufficient.
    if (!isLaunchMode() && userId) {
      const balance = await creditsRepo.getBalance(userId);
      if (balance < creditCost) {
        throw new BadRequestError(
          `Insufficient credits. Need ${creditCost}, have ${balance}.`,
          'INSUFFICIENT_CREDITS',
        );
      }
    }

    const job = await jobsRepo.createJob({
      userId: userId ?? undefined,
      originalUrl,
      settings,
      status: 'PROCESSING',
      processingType,
      creditCost,
    });

    // Deduct credits or track daily usage depending on mode
    let creditsRemaining: number | undefined;
    let dailyUsage: { used: number; limit: number; resetsAt: string } | undefined;
    if (userId) {
      if (isLaunchMode()) {
        dailyUsage = await incrementDailyUsage(userId);
      } else {
        try {
          creditsRemaining = await creditsService.deductForJob(userId, processingType, job.id);
        } catch (err) {
          // Credit deduction failed (e.g., race condition) — clean up orphaned job
          await jobsRepo.updateJob(job.id, { status: 'FAILED', results: [] }).catch(() => {});
          throw err;
        }
      }
    }

    // Resolve prompt: filter ID lookup → settings-based → default
    let prompt: string | undefined;
    let promptSource = 'default';
    if (settings && typeof settings === 'object' && 'filterId' in settings) {
      const filterId = (settings as { filterId?: string }).filterId;
      const promptVariables = (settings as { promptVariables?: Record<string, string | string[]> }).promptVariables ?? {};
      if (filterId) {
        prompt = filtersService.resolvePrompt(filterId, promptVariables) ?? undefined;
        if (prompt) {
          promptSource = `filter:${filterId}`;
        } else {
          logger.warn({ filterId }, 'Filter ID provided but no prompt found in promptMap');
        }
      }
    }
    if (!prompt && settings) {
      prompt = buildPromptFromSettings(settings as Record<string, unknown>);
      promptSource = 'settings';
    }
    if (!prompt) {
      prompt = DEFAULT_PROMPT;
    }
    logger.info({ jobId: job.id, promptSource, promptLength: prompt.length }, 'Resolved prompt for AI processing');

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
        // Refund credits on AI processing failure (not in launch mode — no credits deducted)
        if (userId && !isLaunchMode()) {
          creditsService.refundForJob(userId, creditCost, job.id).catch((refundErr) => {
            logger.error({ err: refundErr, jobId: job.id }, 'Failed to refund credits after job failure');
          });
        }
      });

    return { id: job.id, status: job.status, originalUrl: job.originalUrl, creditsRemaining, dailyUsage };
  },

  async createGuestJob(
    fileBuffer: Buffer,
    mimeType: string,
    settingsStr: string | undefined,
    sessionId: string,
  ): Promise<{ id: string; status: string; originalUrl: string }> {
    if (isLaunchMode()) {
      throw new ForbiddenError('Registration required to use GLOW', 'GUEST_DISABLED');
    }

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
    filters?: { status?: string },
  ): Promise<Awaited<ReturnType<typeof jobsRepo.findByUserId>>> {
    return jobsRepo.findByUserId(userId, page, limit, filters);
  },

  async deleteJob(jobId: string, userId: string): Promise<void> {
    const job = await jobsRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');
    }
    if (job.userId !== userId) {
      throw new ForbiddenError('Access denied', 'JOB_FORBIDDEN');
    }
    await jobsRepo.deleteByIdAndUserId(jobId, userId);
  },

  async bulkDeleteJobs(jobIds: string[], userId: string): Promise<{ deleted: number }> {
    const deleted = await jobsRepo.deleteManyByIdsAndUserId(jobIds, userId);
    return { deleted };
  },

  async getDashboardStats(userId: string): Promise<{
    totalJobs: number;
    totalPhotos: number;
    credits: number;
    plan: string;
    dailyUsage?: { used: number; limit: number; resetsAt: string };
  }> {
    const [stats, user] = await Promise.all([
      jobsRepo.getStatsByUserId(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, subscription: { select: { plan: true } } },
      }),
    ]);

    if (isLaunchMode()) {
      const dailyUsage = await getDailyUsage(userId);
      return {
        totalJobs: stats.totalJobs,
        totalPhotos: stats.totalResults,
        credits: dailyUsage.limit - dailyUsage.used,
        plan: 'LAUNCH',
        dailyUsage,
      };
    }

    return {
      totalJobs: stats.totalJobs,
      totalPhotos: stats.totalResults,
      credits: user?.credits ?? 0,
      plan: user?.subscription?.plan ?? 'FREE',
    };
  },

  async getResultImages(userId: string): Promise<{ jobId: string; imageUrl: string; variantIndex: number; createdAt: Date }[]> {
    const jobs = await jobsRepo.findDoneResultsByUserId(userId);
    const images: { jobId: string; imageUrl: string; variantIndex: number; createdAt: Date }[] = [];

    for (const job of jobs) {
      const results = job.results as string[] | null;
      if (!results) continue;
      for (let i = 0; i < results.length; i++) {
        images.push({
          jobId: job.id,
          imageUrl: results[i],
          variantIndex: i,
          createdAt: job.createdAt,
        });
      }
    }

    return images;
  },

  async createBatch(
    files: Array<{ buffer: Buffer; mimeType: string }>,
    settingsStr: string | undefined,
    userId: string,
    processingType: string = 'ENHANCE',
  ): Promise<{ batchId: string; jobs: Array<{ id: string; status: string }>; creditsRemaining: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, subscription: { select: { plan: true } } },
    });
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (files.length === 0) {
      throw new BadRequestError('At least one file required', 'NO_FILES');
    }

    const creditCost = creditsService.getCost(processingType);

    if (isLaunchMode()) {
      // In launch mode: check daily limit has room for all files
      const { used, limit } = await getDailyUsage(userId);
      const remaining = limit - used;
      if (files.length > remaining) {
        throw new BadRequestError(
          `Daily limit: ${remaining} generations remaining today (need ${files.length})`,
          'DAILY_LIMIT_REACHED',
        );
      }
    } else {
      // Normal mode: check plan and credits
      const planConfig = getPlanConfig(user.subscription?.plan ?? 'FREE');
      if (!planConfig.batchUploadEnabled) {
        throw new ForbiddenError('Batch upload requires ULTRA plan', 'ULTRA_REQUIRED');
      }
      if (files.length > planConfig.maxBatchSize) {
        throw new BadRequestError(`Maximum ${planConfig.maxBatchSize} files per batch`, 'TOO_MANY_FILES');
      }
      const totalCost = files.length * creditCost;
      if (user.credits < totalCost) {
        throw new BadRequestError(
          `Insufficient credits. Need ${totalCost}, have ${user.credits}.`,
          'INSUFFICIENT_CREDITS',
        );
      }
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

    // Resolve prompt once for the batch (all jobs share same settings)
    let batchPrompt: string | undefined;
    let batchPromptSource = 'default';
    if (settings && typeof settings === 'object' && 'filterId' in settings) {
      const filterId = (settings as { filterId?: string }).filterId;
      const promptVariables = (settings as { promptVariables?: Record<string, string | string[]> }).promptVariables ?? {};
      if (filterId) {
        batchPrompt = filtersService.resolvePrompt(filterId, promptVariables) ?? undefined;
        if (batchPrompt) {
          batchPromptSource = `filter:${filterId}`;
        } else {
          logger.warn({ filterId }, 'Filter ID provided but no prompt found in promptMap (batch)');
        }
      }
    }
    if (!batchPrompt && settings) {
      batchPrompt = buildPromptFromSettings(settings as Record<string, unknown>);
      batchPromptSource = 'settings';
    }
    if (!batchPrompt) {
      batchPrompt = DEFAULT_PROMPT;
    }
    logger.info({ batchId, batchPromptSource, promptLength: batchPrompt.length }, 'Resolved prompt for batch AI processing');

    // Process files sequentially to ensure correct credit deduction
    let creditsRemaining = user.credits;
    const jobs: Array<{ id: string; status: string }> = [];

    for (const file of files) {
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
        processingType,
        creditCost,
      });

      // Deduct credits after job creation (skip in launch mode)
      if (!isLaunchMode()) {
        creditsRemaining = await creditsService.deductForJob(userId, processingType, job.id);
      }

      // Process with AI asynchronously (fire-and-forget)
      processImageWithAI(file.buffer, batchPrompt)
        .then(async (result) => {
          await jobsRepo.updateJob(job.id, { status: 'DONE', results: result.urls });
          schedulePhotoReadyEmail(userId, job.id).catch((err: unknown) =>
            logger.warn({ err }, 'Failed to schedule photo ready email for batch job'),
          );
        })
        .catch(async (err) => {
          logger.error({ err, jobId: job.id }, 'AI image processing failed for batch job');
          await jobsRepo.updateJob(job.id, { status: 'FAILED', results: [] }).catch(() => {
            // Ignore DB update errors in background
          });
          // Refund credits on AI processing failure (not in launch mode — no credits deducted)
          if (!isLaunchMode()) {
            creditsService.refundForJob(userId, creditCost, job.id).catch((refundErr) => {
              logger.error({ err: refundErr, jobId: job.id }, 'Failed to refund credits after batch job failure');
            });
          }
        });

      jobs.push({ id: job.id, status: job.status });
    }

    // In launch mode, increment daily usage counter for all files in batch
    if (isLaunchMode()) {
      for (let i = 0; i < files.length; i++) {
        await incrementDailyUsage(userId);
      }
      const usage = await getDailyUsage(userId);
      creditsRemaining = usage.limit - usage.used;
    }

    return { batchId, jobs, creditsRemaining };
  },
};
