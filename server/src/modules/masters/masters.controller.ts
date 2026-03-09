import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import type { MastersService } from './masters.service.js';
import { z } from 'zod';

const FeaturedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
  niche: z.string().optional(),
});

const CatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  niche: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
});

export function createMastersController(mastersService: MastersService) {
  return {
    async getFeatured(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { limit, niche } = FeaturedQuerySchema.parse(request.query);
      const masters = await mastersService.getFeaturedMasters(limit, niche);
      reply.send(successResponse('Featured masters retrieved', masters));
    },

    async getCatalog(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { page, limit, niche, city, search } = CatalogQuerySchema.parse(request.query);
      const { items, totalItems } = await mastersService.getCatalogMasters({
        page,
        limit,
        niche,
        city,
        search,
      });
      reply.send(paginatedResponse('Masters catalog retrieved', items, page, limit, totalItems));
    },
  };
}
