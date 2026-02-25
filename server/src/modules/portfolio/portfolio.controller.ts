import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreatePortfolioItemSchema,
  UpdatePortfolioItemSchema,
  PortfolioItemIdSchema,
  PublicPortfolioParamsSchema,
  ReorderPortfolioSchema,
} from './portfolio.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { PortfolioService } from './portfolio.service.js';

export function createPortfolioController(portfolioService: PortfolioService) {
  return {
    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const items = await portfolioService.getMyItems(request.user!.id);
      reply.send(successResponse('Portfolio retrieved', items));
    },

    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = CreatePortfolioItemSchema.parse(request.body);
      const item = await portfolioService.createItem(request.user!.id, input);
      reply.status(201).send(successResponse('Item added', item));
    },

    async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PortfolioItemIdSchema.parse(request.params);
      const input = UpdatePortfolioItemSchema.parse(request.body);
      const item = await portfolioService.updateItem(request.user!.id, id, input);
      reply.send(successResponse('Item updated', item));
    },

    async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PortfolioItemIdSchema.parse(request.params);
      await portfolioService.deleteItem(request.user!.id, id);
      reply.send(successResponse('Item deleted', null));
    },

    async reorder(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = ReorderPortfolioSchema.parse(request.body);
      const items = await portfolioService.reorderItems(request.user!.id, input);
      reply.send(successResponse('Portfolio reordered', items));
    },

    async getPublic(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = PublicPortfolioParamsSchema.parse(request.params);
      const data = await portfolioService.getPublicPortfolio(username);
      reply.send(successResponse('Portfolio retrieved', data));
    },
  };
}
