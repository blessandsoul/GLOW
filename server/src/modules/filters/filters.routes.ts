import type { FastifyInstance } from 'fastify';
import { filtersController } from './filters.controller.js';
import { authenticate, authorize } from '../../libs/auth.js';

export async function filtersRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', filtersController.getFilters);
  app.post('/suggest-variables', { preHandler: [authenticate] }, filtersController.suggestVariables);

  // Admin: variable suggestion pool management
  const adminGuard = [authenticate, authorize('ADMIN')];
  app.get('/variable-pool-status', { preHandler: adminGuard }, filtersController.variablePoolStatus);
  app.post('/replenish-variables', { preHandler: adminGuard }, filtersController.replenishVariables);
}
