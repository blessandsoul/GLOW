import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { CatalogService } from './catalog.service.js';
import { z } from 'zod';

const DistrictsQuerySchema = z.object({
  citySlug: z.string().optional(),
});

const StyleTagsQuerySchema = z.object({
  niche: z.string().optional(),
});

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

    async getDistricts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { citySlug } = DistrictsQuerySchema.parse(request.query);
      const districts = await catalogService.getDistricts(citySlug);
      reply.send(successResponse('Districts retrieved', districts));
    },

    async getBrands(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const brands = await catalogService.getBrands();
      reply.send(successResponse('Brands retrieved', brands));
    },

    async getStyleTags(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { niche } = StyleTagsQuerySchema.parse(request.query);
      const styleTags = await catalogService.getStyleTags(niche);
      reply.send(successResponse('Style tags retrieved', styleTags));
    },
  };
}
