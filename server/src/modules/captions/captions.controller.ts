import type { FastifyRequest, FastifyReply } from 'fastify';
import { GenerateCaptionParamsSchema, GenerateCaptionQuerySchema } from './captions.schemas.js';
import { captionsService } from './captions.service.js';
import { successResponse } from '../../shared/responses/successResponse.js';
import type { JwtPayload } from '../../shared/types/index.js';

export const captionsController = {
  async generate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = GenerateCaptionParamsSchema.parse(request.params);
    const { force } = GenerateCaptionQuerySchema.parse(request.query);
    const user = request.user as JwtPayload;

    const caption = await captionsService.getOrGenerateCaption(jobId, user.id, force);
    await reply.send(successResponse('Caption generated', caption));
  },

  async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = GenerateCaptionParamsSchema.parse(request.params);
    const user = request.user as JwtPayload;

    const caption = await captionsService.getCachedCaption(jobId, user.id);
    await reply.send(successResponse('Caption retrieved', caption));
  },
};
