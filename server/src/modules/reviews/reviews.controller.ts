import type { FastifyRequest, FastifyReply } from 'fastify';
import { reviewsService } from './reviews.service.js';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewParamSchema,
  MasterReviewsParamSchema,
  PaginationSchema,
} from './reviews.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';

export const reviewsController = {
  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = CreateReviewSchema.parse(request.body);
    const review = await reviewsService.create(request.user.id, body);
    reply.status(201).send(successResponse('Review submitted successfully', review));
  },

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { reviewId } = ReviewParamSchema.parse(request.params);
    const body = UpdateReviewSchema.parse(request.body);
    const review = await reviewsService.update(request.user.id, reviewId, body);
    reply.send(successResponse('Review updated successfully', review));
  },

  async delete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { reviewId } = ReviewParamSchema.parse(request.params);
    await reviewsService.delete(request.user.id, request.user.role, reviewId);
    reply.send(successResponse('Review deleted successfully', null));
  },

  async getByMaster(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterId } = MasterReviewsParamSchema.parse(request.params);
    const { page, limit } = PaginationSchema.parse(request.query);
    const { items, totalItems } = await reviewsService.getByMaster(masterId, page, limit);
    reply.send(paginatedResponse('Reviews retrieved successfully', items, page, limit, totalItems));
  },

  async getMyReview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterId } = MasterReviewsParamSchema.parse(request.params);
    const review = await reviewsService.getMyReview(request.user.id, masterId);
    reply.send(successResponse('My review retrieved', review));
  },
};
