import type { FastifyInstance } from 'fastify';
import { creditsController } from './credits.controller.js';
import { authenticate } from '../../libs/auth.js';

export async function creditsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/balance', { preHandler: [authenticate] }, creditsController.getBalance);
  app.get('/packages', creditsController.getPackages);
  app.post('/purchase', { preHandler: [authenticate] }, creditsController.purchase);
  app.get('/history', { preHandler: [authenticate] }, creditsController.getHistory);
}
