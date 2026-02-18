import type { FastifyInstance } from 'fastify';
import { referralsController } from './referrals.controller.js';
import { authenticate } from '../../libs/auth.js';

export async function referralsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/my', { preHandler: [authenticate] }, referralsController.getMyStats);
}
