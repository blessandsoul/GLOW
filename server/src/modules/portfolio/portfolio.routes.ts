import type { FastifyInstance } from 'fastify';
import { createPortfolioController } from './portfolio.controller.js';
import { createPortfolioService } from './portfolio.service.js';
import { authenticate } from '@/libs/auth.js';

export async function portfolioRoutes(app: FastifyInstance): Promise<void> {
  const portfolioService = createPortfolioService();
  const controller = createPortfolioController(portfolioService);

  // Authenticated routes
  app.get('/me', { preHandler: [authenticate] }, controller.getMe);
  app.post('/', { preHandler: [authenticate] }, controller.create);
  app.patch('/:id', { preHandler: [authenticate] }, controller.update);
  app.delete('/:id', { preHandler: [authenticate] }, controller.remove);

  // Public route
  app.get('/public/:username', controller.getPublic);
}
