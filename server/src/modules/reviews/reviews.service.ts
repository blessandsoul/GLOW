import { reviewsRepo } from './reviews.repo.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '@/shared/errors/errors.js';
import type { CreateReviewInput, UpdateReviewInput } from './reviews.schemas.js';

export const reviewsService = {
  async create(userId: string, data: CreateReviewInput) {
    // Cannot review yourself
    if (userId === data.masterId) {
      throw new BadRequestError('Cannot review yourself', 'SELF_REVIEW');
    }

    // Master must exist and have MASTER role
    const masterExists = await reviewsRepo.masterExists(data.masterId);
    if (!masterExists) {
      throw new NotFoundError('Master not found', 'MASTER_NOT_FOUND');
    }

    // One review per user per master (unique constraint)
    const existing = await reviewsRepo.findByUserAndMaster(userId, data.masterId);
    if (existing) {
      throw new ConflictError(
        'You have already reviewed this master',
        'REVIEW_ALREADY_EXISTS',
      );
    }

    return reviewsRepo.create(userId, data);
  },

  async update(userId: string, reviewId: string, data: UpdateReviewInput) {
    const review = await reviewsRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found', 'REVIEW_NOT_FOUND');
    }

    if (review.userId !== userId) {
      throw new ForbiddenError('You can only edit your own reviews', 'NOT_REVIEW_OWNER');
    }

    return reviewsRepo.update(reviewId, data);
  },

  async delete(userId: string, userRole: string, reviewId: string) {
    const review = await reviewsRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found', 'REVIEW_NOT_FOUND');
    }

    // Owner or admin can delete
    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only delete your own reviews', 'NOT_REVIEW_OWNER');
    }

    await reviewsRepo.delete(reviewId);
  },

  async getByMaster(masterId: string, page: number, limit: number) {
    const masterExists = await reviewsRepo.masterExists(masterId);
    if (!masterExists) {
      throw new NotFoundError('Master not found', 'MASTER_NOT_FOUND');
    }

    return reviewsRepo.findByMasterId(masterId, page, limit);
  },

  async getMyReview(userId: string, masterId: string) {
    return reviewsRepo.findByUserAndMaster(userId, masterId);
  },
};
