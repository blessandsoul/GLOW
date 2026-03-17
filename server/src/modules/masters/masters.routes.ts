import type { FastifyInstance } from 'fastify';
import { createMastersController } from './masters.controller.js';
import { createMastersService } from './masters.service.js';

export async function mastersRoutes(app: FastifyInstance): Promise<void> {
  const mastersService = createMastersService();
  const controller = createMastersController(mastersService);

  // Public routes — no auth required
  app.get('/featured', controller.getFeatured);
  app.get('/niche-counts', controller.getNicheCounts);
  app.get('/catalog', controller.getCatalog);
}
