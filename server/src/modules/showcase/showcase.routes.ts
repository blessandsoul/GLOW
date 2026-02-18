import type { FastifyInstance } from 'fastify';
import { showcaseController } from './showcase.controller.js';

export async function showcaseRoutes(app: FastifyInstance): Promise<void> {
  // Both routes are PUBLIC — no auth needed
  app.get('/:jobId', showcaseController.get);
  app.post('/:jobId/review', showcaseController.submitReview);
}
