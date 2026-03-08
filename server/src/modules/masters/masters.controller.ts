import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { MastersService } from './masters.service.js';
import { z } from 'zod';

const FeaturedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export function createMastersController(mastersService: MastersService) {
  return {
    async getFeatured(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { limit } = FeaturedQuerySchema.parse(request.query);
      const masters = await mastersService.getFeaturedMasters(limit);
      reply.send(successResponse('Featured masters retrieved', masters));
    },
  };
}
