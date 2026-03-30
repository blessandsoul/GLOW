import type { FastifyRequest, FastifyReply } from 'fastify';
import { BadRequestError } from '@/shared/errors/errors.js';
import { uploadFile, validateImage, processImage } from '@/libs/storage.js';
import type { StorageFile } from '@/libs/storage.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import {
  SellerApplySchema,
  AdminReviewSellerSchema,
  AdminSellersQuerySchema,
  CreateProductSchema,
  UpdateProductSchema,
  ProductsQuerySchema,
  ProductParamSchema,
  UserParamSchema,
  UsernameParamSchema,
} from './marketplace.schemas.js';
import type { MarketplaceService } from './marketplace.service.js';

const UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function createMarketplaceController(service: MarketplaceService) {
  return {
    // ── Seller ──

    async getSellerStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const status = await service.getSellerStatus(request.user!.id);
      reply.send(successResponse('Seller status retrieved', status));
    },

    async applySeller(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = SellerApplySchema.parse(request.body);
      const result = await service.applySeller(request.user!.id, input);
      reply.status(201).send(successResponse('Seller application submitted', result));
    },

    // ── Admin ──

    async adminGetSellers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { page, limit, status } = AdminSellersQuerySchema.parse(request.query);
      const { items, totalItems } = await service.adminGetSellers(page, limit, status);
      reply.send(paginatedResponse('Seller applications retrieved', items, page, limit, totalItems));
    },

    async adminReviewSeller(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { userId } = UserParamSchema.parse(request.params);
      const input = AdminReviewSellerSchema.parse(request.body);
      const result = await service.adminReviewSeller(userId, request.user!.id, input);
      const message = input.action === 'approve' ? 'Seller application approved' : 'Seller application rejected';
      reply.send(successResponse(message, result));
    },

    // ── Products ──

    async getMyProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const products = await service.getMyProducts(request.user!.id);
      reply.send(successResponse('Products retrieved', products));
    },

    async createProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = CreateProductSchema.parse(request.body);
      const product = await service.createProduct(request.user!.id, input);
      reply.status(201).send(successResponse('Product created', product));
    },

    async uploadProductImage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = ProductParamSchema.parse(request.params);

      const data = await request.file();
      if (!data) {
        throw new BadRequestError('No file uploaded', 'NO_FILE');
      }

      let file: StorageFile = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      validateImage(file, UPLOAD_MAX_SIZE);
      file = await processImage(file);

      const imageUrl = await uploadFile(file, 'marketplace');
      const product = await service.uploadProductImage(request.user!.id, id, imageUrl);
      reply.send(successResponse('Image uploaded', product));
    },

    async updateProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = ProductParamSchema.parse(request.params);
      const input = UpdateProductSchema.parse(request.body);
      const product = await service.updateProduct(request.user!.id, id, input);
      reply.send(successResponse('Product updated', product));
    },

    async deleteProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = ProductParamSchema.parse(request.params);
      await service.deleteProduct(request.user!.id, id);
      reply.send(successResponse('Product deleted', null));
    },

    // ── Browse ──

    async getProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const filters = ProductsQuerySchema.parse(request.query);
      const { items, totalItems } = await service.getProducts(filters);
      reply.send(paginatedResponse('Products retrieved', items, filters.page, filters.limit, totalItems));
    },

    async getProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = ProductParamSchema.parse(request.params);
      const product = await service.getProduct(id);
      reply.send(successResponse('Product retrieved', product));
    },

    async getSellerProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const products = await service.getSellerProducts(username);
      reply.send(successResponse('Seller products retrieved', products));
    },
  };
}
