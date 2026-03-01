import type { FastifyRequest, FastifyReply } from 'fastify';
import { AdminUsersQuerySchema } from './admin.schemas.js';
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

    async flushDailyLimits(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const result = await adminService.flushDailyLimits();
      reply.send(successResponse('Daily generation limits flushed', result));
    },
  };
}
