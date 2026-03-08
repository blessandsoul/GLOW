import type { FastifyInstance } from 'fastify';
import { filtersController } from './filters.controller.js';
import { authenticate } from '../../libs/auth.js';

export async function filtersRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', filtersController.getFilters);
  app.post('/suggest-variables', { preHandler: [authenticate] }, filtersController.suggestVariables);
}
