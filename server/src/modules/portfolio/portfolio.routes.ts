import type { FastifyInstance } from 'fastify';
import { createPortfolioController } from './portfolio.controller.js';
import { createPortfolioService } from './portfolio.service.js';
import { authenticate, requirePhoneVerified } from '@/libs/auth.js';

export async function portfolioRoutes(app: FastifyInstance): Promise<void> {
  const portfolioService = createPortfolioService();
  const controller = createPortfolioController(portfolioService);

  // Authenticated routes
  app.get('/me', { preHandler: [authenticate, requirePhoneVerified] }, controller.getMe);
  app.post('/', { preHandler: [authenticate, requirePhoneVerified] }, controller.create);
  app.post('/upload', { preHandler: [authenticate, requirePhoneVerified] }, controller.upload);
  app.patch('/reorder', { preHandler: [authenticate, requirePhoneVerified] }, controller.reorder);
  app.patch('/:id', { preHandler: [authenticate, requirePhoneVerified] }, controller.update);
  app.delete('/:id', { preHandler: [authenticate, requirePhoneVerified] }, controller.remove);

  // Public route
  app.get('/public/:username', controller.getPublic);
}
