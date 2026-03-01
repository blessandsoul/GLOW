import type { FastifyInstance } from 'fastify';
import { createAdminController } from './admin.controller.js';
import { createAdminService } from './admin.service.js';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const adminService = createAdminService();
  const controller = createAdminController(adminService);

  const adminGuard = [authenticate, authorize('ADMIN'), requirePhoneVerified];

  app.get('/users', { preHandler: adminGuard }, controller.getUsers);
  app.get('/stats', { preHandler: adminGuard }, controller.getStats);
  app.post('/flush-daily-limits', { preHandler: adminGuard }, controller.flushDailyLimits);
}
