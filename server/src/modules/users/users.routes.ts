import type { FastifyInstance } from 'fastify';
import { createUsersController } from './users.controller.js';
import { createUsersService } from './users.service.js';
import { authenticate, requirePhoneVerified } from '@/libs/auth.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const usersService = createUsersService();
  const controller = createUsersController(usersService);

  app.patch('/me', { preHandler: [authenticate, requirePhoneVerified] }, controller.updateMe);
  app.delete('/me', { preHandler: [authenticate, requirePhoneVerified] }, controller.deleteMe);
  app.post('/me/avatar', { preHandler: [authenticate, requirePhoneVerified] }, controller.uploadAvatar);
}
