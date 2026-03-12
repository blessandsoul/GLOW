import type { FastifyRequest, FastifyReply } from 'fastify';
import { AdminUsersQuerySchema, userImagesParamsSchema, userImagesQuerySchema, AdminPortfoliosQuerySchema, portfolioItemsParamsSchema, portfolioItemsQuerySchema, BulkSmsBodySchema } from './admin.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import type { AdminService } from './admin.service.js';

export function createAdminController(adminService: AdminService) {
  return {
    async getUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const query = AdminUsersQuerySchema.parse(request.query);
      const { items, totalItems } = await adminService.getUsers(query);
      reply.send(paginatedResponse('Users retrieved', items, query.page, query.limit, totalItems));
    },

    async getStats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const stats = await adminService.getStats();
      reply.send(successResponse('Admin stats retrieved', stats));
    },

    async getUserImages(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { userId } = userImagesParamsSchema.parse(request.params);
      const { page, limit } = userImagesQuerySchema.parse(request.query);
      const { images, totalJobs } = await adminService.getUserImages(userId, page, limit);
      reply.send(paginatedResponse('User images retrieved', images, page, limit, totalJobs));
    },

    async flushDailyLimits(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const result = await adminService.flushDailyLimits(request.user!.id);
      reply.send(successResponse('Daily generation limit flushed', result));
    },

    async getPortfolioUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const query = AdminPortfoliosQuerySchema.parse(request.query);
      const { items, totalItems } = await adminService.getPortfolioUsers(query);
      reply.send(paginatedResponse('Portfolio users retrieved', items, query.page, query.limit, totalItems));
    },

    async getPortfolioItems(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { userId } = portfolioItemsParamsSchema.parse(request.params);
      const { page, limit } = portfolioItemsQuerySchema.parse(request.query);
      const { items, totalItems } = await adminService.getPortfolioItems(userId, page, limit);
      reply.send(paginatedResponse('Portfolio items retrieved', items, page, limit, totalItems));
    },

    async getVerifiedPhoneCount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const data = await adminService.getVerifiedPhoneCount();
      reply.send(successResponse('Verified phone count retrieved', data));
    },

    async sendBulkSms(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const body = BulkSmsBodySchema.parse(request.body);
      const result = await adminService.sendBulkSmsToUsers(body);
      reply.send(successResponse('Bulk SMS sent', result));
    },
  };
}
