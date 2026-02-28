import type { FastifyInstance } from 'fastify';
import { captionsController } from './captions.controller.js';
import { authenticate, requirePhoneVerified } from '../../libs/auth.js';

export async function captionsRoutes(app: FastifyInstance): Promise<void> {
  // Generate caption for a job (creates if not exists, returns cached otherwise)
  app.post('/:jobId', { preHandler: [authenticate, requirePhoneVerified] }, captionsController.generate);

  // Get cached caption (no generation)
  app.get('/:jobId', { preHandler: [authenticate, requirePhoneVerified] }, captionsController.get);
}
