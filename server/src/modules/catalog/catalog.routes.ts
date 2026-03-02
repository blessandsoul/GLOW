import type { FastifyInstance } from 'fastify';
import { createCatalogController } from './catalog.controller.js';
import { createCatalogService } from './catalog.service.js';

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  const catalogService = createCatalogService();
  const controller = createCatalogController(catalogService);

  app.get('/specialities', controller.getSpecialities);
  app.get('/service-categories', controller.getServiceCategories);
}
