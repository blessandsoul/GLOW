import type { FastifyInstance } from 'fastify';
import { showcaseController } from './showcase.controller.js';

export async function showcaseRoutes(app: FastifyInstance): Promise<void> {
  // Both routes are PUBLIC — no auth needed
  app.get('/:jobId', showcaseController.get);
  // H2 fix: rate-limit reviews to prevent unauthenticated spam (3 per IP per hour)
  app.post('/:jobId/review', {
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
  }, showcaseController.submitReview);
}
