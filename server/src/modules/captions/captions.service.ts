import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/errors.js';
import { captionsRepo } from './captions.repo.js';
import { jobsRepo } from '../jobs/jobs.repo.js';
import { generateCaptionFromImage } from '../../libs/ai-caption.js';
import { getPlanConfig } from '../subscriptions/subscriptions.constants.js';
import { logger } from '../../libs/logger.js';

const MAX_REGENERATIONS = 3;

export const captionsService = {
  async getOrGenerateCaption(
    jobId: string,
    userId: string,
    force: boolean = false,
  ) {
    // 1. Load job and verify ownership
    const job = await jobsRepo.findJobByIdWithUser(jobId);
    if (!job) {
      throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');
    }
    if (job.userId !== userId) {
      throw new ForbiddenError('Access denied', 'JOB_FORBIDDEN');
    }
    if (job.status !== 'DONE') {
      throw new BadRequestError('Job processing not complete', 'JOB_NOT_READY');
    }

    // 2. If not forcing regeneration, return cached caption
    if (!force) {
      const existing = await captionsRepo.findByJobId(jobId);
      if (existing) {
        return existing;
      }
    }

    // 3. Check subscription: captionsEnabled
    const userPlan = job.user?.subscription?.plan ?? 'FREE';
    const planConfig = getPlanConfig(userPlan);
    if (!planConfig.captionsEnabled) {
      throw new ForbiddenError(
        'Caption generation requires PRO or ULTRA plan',
        'CAPTIONS_NOT_ENABLED',
      );
    }

    // 4. If forcing, check regeneration limit
    if (force) {
      const totalGenerated = await captionsRepo.countByJobId(jobId);
      if (totalGenerated >= MAX_REGENERATIONS) {
        throw new BadRequestError(
          'Maximum caption regenerations reached (3)',
          'CAPTION_REGEN_LIMIT',
        );
      }
      // Delete existing caption before regeneration
      await captionsRepo.deleteByJobId(jobId);
    }

    // 5. Load result image
    const results = job.results as string[] | null;
    if (!results || results.length === 0) {
      throw new BadRequestError('No result images found', 'NO_RESULTS');
    }

    const resultUrl = results[0];
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

    // 6. Generate caption via Gemini
    const mimeType = resultUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const captionResult = await generateCaptionFromImage(imageBuffer, mimeType);

    // 7. Save to DB and return
    const caption = await captionsRepo.create({
      jobId,
      text: captionResult.text,
      hashtags: captionResult.hashtags,
    });

    logger.info({ jobId, captionId: caption.id }, 'Caption generated and saved');
    return caption;
  },

  async getCachedCaption(jobId: string, userId: string) {
    const job = await jobsRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');
    }
    if (job.userId && job.userId !== userId) {
      throw new ForbiddenError('Access denied', 'JOB_FORBIDDEN');
    }

    return captionsRepo.findByJobId(jobId);
  },
};
