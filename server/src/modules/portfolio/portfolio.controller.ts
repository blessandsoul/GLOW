import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreatePortfolioItemSchema,
  UpdatePortfolioItemSchema,
  UploadPortfolioItemSchema,
  PortfolioItemIdSchema,
  PublicPortfolioParamsSchema,
  ReorderPortfolioSchema,
} from './portfolio.schemas.js';
import { validateImage, processImage, uploadFile } from '@/libs/storage.js';
import { BadRequestError } from '@/shared/errors/errors.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { PortfolioService } from './portfolio.service.js';
import type { StorageFile } from '@/libs/storage.js';

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

    async upload(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const data = await request.file();
      if (!data) {
        throw new BadRequestError('No file uploaded', 'NO_FILE');
      }

      // Collect form fields
      const fields: Record<string, string> = {};
      for (const [key, field] of Object.entries(data.fields)) {
        if (field && typeof field === 'object' && 'value' in field) {
          fields[key] = (field as { value: string }).value;
        }
      }
      const metadata = UploadPortfolioItemSchema.parse(fields);

      let file: StorageFile = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      validateImage(file, 10 * 1024 * 1024);
      file = await processImage(file);

      const imageUrl = await uploadFile(file, 'portfolio');
      const item = await portfolioService.uploadItem(request.user!.id, imageUrl, metadata);
      reply.status(201).send(successResponse('Image uploaded', item));
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
