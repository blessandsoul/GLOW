import type { FastifyRequest, FastifyReply } from 'fastify';
import { ShowcaseParamSchema, SubmitReviewSchema } from './showcase.schemas.js';
import { showcaseService } from './showcase.service.js';
import { successResponse } from '@/shared/responses/successResponse.js';

export const showcaseController = {
  async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = ShowcaseParamSchema.parse(request.params);
    const data = await showcaseService.getShowcase(jobId);
    reply.send(successResponse('Showcase retrieved', data));
  },

  async submitReview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = ShowcaseParamSchema.parse(request.params);
    const body = SubmitReviewSchema.parse(request.body);
    const review = await showcaseService.submitReview(jobId, body);
    reply.send(successResponse('Review submitted', review));
  },
};
