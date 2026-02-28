import type { FastifyInstance } from 'fastify';
import { createTrendsController } from './trends.controller.js';
import { createTrendsService } from './trends.service.js';
import { authenticate, requirePhoneVerified } from '@/libs/auth.js';

export async function trendsRoutes(app: FastifyInstance): Promise<void> {
  const trendsService = createTrendsService();
  const controller = createTrendsController(trendsService);

  // Public route
  app.get('/current', controller.getCurrent);

  // Authenticated route
  app.get('/archive', { preHandler: [authenticate, requirePhoneVerified] }, controller.getArchive);
}
