import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { CatalogService } from './catalog.service.js';

export function createCatalogController(catalogService: CatalogService) {
  return {
    async getSpecialities(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const specialities = await catalogService.getSpecialities();
      reply.send(successResponse('Specialities retrieved', specialities));
    },

    async getServiceCategories(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const categories = await catalogService.getServiceCategories();
      reply.send(successResponse('Service categories retrieved', categories));
    },
  };
}
