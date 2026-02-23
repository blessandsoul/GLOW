import type { FastifyInstance } from 'fastify';
import { createTrendsController } from './trends.controller.js';
import { createTrendsService } from './trends.service.js';
import { authenticate } from '@/libs/auth.js';

export async function trendsRoutes(app: FastifyInstance): Promise<void> {
  const trendsService = createTrendsService();
  const controller = createTrendsController(trendsService);

  // Public route
  app.get('/current', controller.getCurrent);

  // Authenticated route
  app.get('/archive', { preHandler: [authenticate] }, controller.getArchive);
}
