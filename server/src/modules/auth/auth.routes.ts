import type { FastifyInstance } from 'fastify';
import { createAuthController } from './auth.controller.js';
import { createAuthService } from './auth.service.js';
import { authenticate } from '@/libs/auth.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = createAuthService(app);
  const controller = createAuthController(authService);

  app.post('/register', controller.register);
  app.post('/login', controller.login);
  app.post('/refresh', controller.refresh);
  app.post('/logout', controller.logout);
  app.get('/me', { preHandler: [authenticate] }, controller.me);
}
