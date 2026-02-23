import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { filtersService } from './filters.service.js';

export const filtersController = {
  async getFilters(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const metadata = filtersService.getMetadata();
    reply.send(successResponse('Filters retrieved successfully', metadata));
  },
};
