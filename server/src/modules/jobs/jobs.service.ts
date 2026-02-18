import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/errors.js';
import { jobsRepo } from './jobs.repo.js';
import { applyWatermark } from '../../libs/watermark.js';
import { redis } from '../../libs/redis.js';

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

    // Fetch image from URL
    const response = await fetch(results[variantIndex]);
    if (!response.ok) {
      throw new NotFoundError('Could not fetch image', 'IMAGE_FETCH_FAILED');
    }
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    const finalBuffer = needsWatermark
      ? await applyWatermark(imageBuffer)
      : imageBuffer;

    return {
      buffer: finalBuffer,
      filename: `lashme-${jobId}-${variantIndex}.jpg`,
    };
  },

  async createJobFromFile(
    _fileBuffer: Buffer,
    _mimeType: string,
    settingsStr: string | undefined,
    userId: string | undefined,
  ): Promise<{ id: string; status: string; originalUrl: string }> {
    // For MVP: store a placeholder URL (no S3 yet)
    // In production this would upload to S3 and get a real URL
    const originalUrl = `https://picsum.photos/seed/${Date.now()}/400/600`;

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

    // Simulate AI processing: update to DONE with mock results after a short delay
    // In production, this would enqueue a BullMQ job for real AI processing
    setTimeout(() => {
      const mockResults = [
        `https://picsum.photos/seed/${job.id}-0/400/600`,
        `https://picsum.photos/seed/${job.id}-1/400/600`,
        `https://picsum.photos/seed/${job.id}-2/400/600`,
        `https://picsum.photos/seed/${job.id}-3/400/600`,
      ];
      jobsRepo.updateJob(job.id, { status: 'DONE', results: mockResults }).catch(() => {
        // Ignore errors in background processing
      });
    }, 4000); // 4 second delay

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
  ): Promise<{ items: unknown[]; total: number }> {
    return jobsRepo.findByUserId(userId, page, limit);
  },

  async createBatch(
    files: Array<{ buffer: Buffer; mimeType: string }>,
    settingsStr: string | undefined,
    userId: string,
  ): Promise<{ batchId: string; jobs: Array<{ id: string; status: string }> }> {
    if (files.length === 0) {
      throw new BadRequestError('At least one file required', 'NO_FILES');
    }
    if (files.length > 10) {
      throw new BadRequestError('Maximum 10 files per batch', 'TOO_MANY_FILES');
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
        const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const originalUrl = `https://picsum.photos/seed/${seed}/400/600`;
        const job = await jobsRepo.createJob({
          userId,
          originalUrl,
          settings,
          batchId,
          status: 'PROCESSING',
        });

        // Simulate AI processing with staggered completion
        const delay = 4000 + Math.random() * 2000;
        setTimeout(() => {
          const mockResults = [
            `https://picsum.photos/seed/${job.id}-0/400/600`,
            `https://picsum.photos/seed/${job.id}-1/400/600`,
            `https://picsum.photos/seed/${job.id}-2/400/600`,
            `https://picsum.photos/seed/${job.id}-3/400/600`,
          ];
          jobsRepo.updateJob(job.id, { status: 'DONE', results: mockResults }).catch(() => {
            // Ignore errors in background processing
          });
        }, delay);

        return { id: job.id, status: job.status };
      }),
    );

    return { batchId, jobs };
  },
};
