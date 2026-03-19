import type { FastifyRequest, FastifyReply } from 'fastify';
import { favoritesService } from './favorites.service.js';
import {
  MasterProfileIdParamSchema,
  PortfolioItemIdParamSchema,
  FavoriteStatusQuerySchema,
} from './favorites.schemas.js';
import { PaginationSchema } from '@/shared/schemas/pagination.schema.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';

export const favoritesController = {
  async addMaster(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterProfileId } = MasterProfileIdParamSchema.parse(request.params);
    const favorite = await favoritesService.addMaster(request.user.id, masterProfileId);
    reply.status(201).send(successResponse('Master added to favorites', favorite));
  },

  async removeMaster(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterProfileId } = MasterProfileIdParamSchema.parse(request.params);
    await favoritesService.removeMaster(request.user.id, masterProfileId);
    reply.send(successResponse('Master removed from favorites', null));
  },

  async listFavoriteMasters(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit } = PaginationSchema.parse(request.query);
    const { items, totalItems } = await favoritesService.listFavoriteMasters(
      request.user.id,
      page,
      limit,
    );
    reply.send(paginatedResponse('Favorite masters retrieved successfully', items, page, limit, totalItems));
  },

  async addPortfolioItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { portfolioItemId } = PortfolioItemIdParamSchema.parse(request.params);
    const favorite = await favoritesService.addPortfolioItem(request.user.id, portfolioItemId);
    reply.status(201).send(successResponse('Portfolio item added to favorites', favorite));
  },

  async removePortfolioItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { portfolioItemId } = PortfolioItemIdParamSchema.parse(request.params);
    await favoritesService.removePortfolioItem(request.user.id, portfolioItemId);
    reply.send(successResponse('Portfolio item removed from favorites', null));
  },

  async listFavoritePortfolioItems(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit } = PaginationSchema.parse(request.query);
    const { items, totalItems } = await favoritesService.listFavoritePortfolioItems(
      request.user.id,
      page,
      limit,
    );
    reply.send(
      paginatedResponse('Favorite portfolio items retrieved successfully', items, page, limit, totalItems),
    );
  },

  async getStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterIds, portfolioItemIds } = FavoriteStatusQuerySchema.parse(request.query);

    const parsedMasterIds = masterIds ? masterIds.split(',').filter(Boolean) : [];
    const parsedPortfolioItemIds = portfolioItemIds ? portfolioItemIds.split(',').filter(Boolean) : [];

    const status = await favoritesService.getStatus(
      request.user.id,
      parsedMasterIds,
      parsedPortfolioItemIds,
    );
    reply.send(successResponse('Favorite status retrieved successfully', status));
  },
};
