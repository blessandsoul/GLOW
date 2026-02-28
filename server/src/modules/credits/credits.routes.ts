import type { FastifyInstance } from 'fastify';
import { creditsController } from './credits.controller.js';
import { authenticate, requirePhoneVerified } from '../../libs/auth.js';

export async function creditsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/balance', { preHandler: [authenticate, requirePhoneVerified] }, creditsController.getBalance);
  app.get('/packages', creditsController.getPackages);
  app.post('/purchase', { preHandler: [authenticate, requirePhoneVerified] }, creditsController.purchase);
  app.get('/history', { preHandler: [authenticate, requirePhoneVerified] }, creditsController.getHistory);
}
