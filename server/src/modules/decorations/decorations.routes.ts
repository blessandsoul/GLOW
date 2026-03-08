import type { FastifyInstance } from 'fastify';
import { decorationsController } from './decorations.controller.js';
import { authenticate, authorize } from '../../libs/auth.js';

export async function decorationsRoutes(app: FastifyInstance): Promise<void> {
  // Generate AI decoration suggestions
  app.post('/suggest', { preHandler: [authenticate] }, decorationsController.suggest);

  // Admin routes
  const adminGuard = [authenticate, authorize('ADMIN')];
  app.get('/pool-status', { preHandler: adminGuard }, decorationsController.poolStatus);
  app.post('/replenish', { preHandler: adminGuard }, decorationsController.replenish);
}
