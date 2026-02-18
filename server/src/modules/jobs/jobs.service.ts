import { NotFoundError, ForbiddenError } from '../../shared/errors/errors.js';
import { jobsRepo } from './jobs.repo.js';
import { applyWatermark } from '../../libs/watermark.js';

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
};
