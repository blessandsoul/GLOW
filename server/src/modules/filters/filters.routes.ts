import type { FastifyInstance } from 'fastify';
import { filtersController } from './filters.controller.js';

export async function filtersRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', filtersController.getFilters);
}
