import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import type { MastersService } from './masters.service.js';
import { z } from 'zod';

const FeaturedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
  niche: z.string().optional(),
});

const booleanFromQuery = z.preprocess(
  (v) => v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : undefined,
  z.boolean().optional(),
);

const CatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  niche: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  isVerified: booleanFromQuery,
  isCertified: booleanFromQuery,
  isHygieneVerified: booleanFromQuery,
  isQualityProducts: booleanFromQuery,
  isTopRated: booleanFromQuery,
  masterTier: z.string().optional(),
  language: z.string().optional(),
  locationType: z.enum(['salon', 'home_studio', 'mobile', 'client_visit']).optional(),
  district: z.string().optional(),
  brandSlug: z.string().optional(),
  styleTagSlug: z.string().optional(),
  swLat: z.coerce.number().min(-90).max(90).optional(),
  swLng: z.coerce.number().min(-180).max(180).optional(),
  neLat: z.coerce.number().min(-90).max(90).optional(),
  neLng: z.coerce.number().min(-180).max(180).optional(),
});

export function createMastersController(mastersService: MastersService) {
  return {
    async getFeatured(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { limit, niche } = FeaturedQuerySchema.parse(request.query);
      const masters = await mastersService.getFeaturedMasters(limit, niche);
      reply.send(successResponse('Featured masters retrieved', masters));
    },

    async getNicheCounts(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const counts = await mastersService.getNicheCounts();
      reply.send(successResponse('Niche counts retrieved', counts));
    },

    async getCatalog(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { page, limit, niche, city, search, isVerified, isCertified, isHygieneVerified, isQualityProducts, isTopRated, masterTier, language, locationType, district, brandSlug, styleTagSlug, swLat, swLng, neLat, neLng } = CatalogQuerySchema.parse(request.query);
      const bounds = swLat !== undefined && swLng !== undefined && neLat !== undefined && neLng !== undefined
        ? { swLat, swLng, neLat, neLng }
        : undefined;
      const { items, totalItems } = await mastersService.getCatalogMasters({
        page,
        limit,
        niche,
        city,
        search,
        isVerified,
        isCertified,
        isHygieneVerified,
        isQualityProducts,
        isTopRated,
        masterTier,
        language,
        locationType,
        district,
        brandSlug,
        styleTagSlug,
        bounds,
      });
      reply.send(paginatedResponse('Masters catalog retrieved', items, page, limit, totalItems));
    },
  };
}
