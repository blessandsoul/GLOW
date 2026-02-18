import { showcaseRepo } from './showcase.repo.js';
import { NotFoundError, BadRequestError } from '@/shared/errors/errors.js';
import type { SubmitReviewInput } from './showcase.schemas.js';

export interface ShowcaseResult {
  jobId: string;
  masterName: string;
  instagramHandle: string | null;
  results: string[];
  createdAt: Date;
}

export const showcaseService = {
  async getShowcase(jobId: string): Promise<ShowcaseResult> {
    const job = await showcaseRepo.findJobForShowcase(jobId);

    if (!job) {
      throw new NotFoundError('Showcase not found', 'SHOWCASE_NOT_FOUND');
    }

    const brandingProfile = job.user?.brandingProfile ?? null;
    const firstName = job.user?.firstName ?? '';
    const lastName = job.user?.lastName ?? '';

    const masterName =
      brandingProfile?.displayName ??
      `${firstName} ${lastName}`.trim();

    const instagramHandle = brandingProfile?.instagramHandle ?? null;

    return {
      jobId: job.id,
      masterName,
      instagramHandle,
      results: (job.results as string[]) ?? [],
      createdAt: job.createdAt,
    };
  },

  async submitReview(
    jobId: string,
    data: Pick<SubmitReviewInput, 'rating' | 'text' | 'clientName'>,
  ) {
    const job = await showcaseRepo.findJobForShowcase(jobId);

    if (!job) {
      throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');
    }

    if (job.userId === null) {
      throw new BadRequestError('Cannot submit review for guest job', 'NO_MASTER');
    }

    const review = await showcaseRepo.createReview({
      jobId,
      masterId: job.userId,
      rating: data.rating,
      text: data.text,
      clientName: data.clientName,
    });

    return review;
  },
};
