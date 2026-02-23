import type { FastifyRequest, FastifyReply } from 'fastify';
import { TrendArchiveQuerySchema } from './trends.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import type { TrendsService } from './trends.service.js';

export function createTrendsController(trendsService: TrendsService) {
  return {
    async getCurrent(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const trends = await trendsService.getCurrentTrends();
      reply.send(successResponse('Trends retrieved', trends));
    },

    async getArchive(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { page, limit } = TrendArchiveQuerySchema.parse(request.query);
      const { items, totalItems } = await trendsService.getArchive(page, limit);
      reply.send(paginatedResponse('Archive retrieved', items, page, limit, totalItems));
    },
  };
}
