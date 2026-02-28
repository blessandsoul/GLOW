import type { FastifyInstance } from 'fastify';
import { referralsController } from './referrals.controller.js';
import { authenticate, requirePhoneVerified } from '../../libs/auth.js';

export async function referralsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/my', { preHandler: [authenticate, requirePhoneVerified] }, referralsController.getMyStats);
}
