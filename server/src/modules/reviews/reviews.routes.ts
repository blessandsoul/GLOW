import type { FastifyInstance } from 'fastify';
import { reviewsController } from './reviews.controller.js';
import { authenticate } from '@/libs/auth.js';

export async function reviewsRoutes(app: FastifyInstance): Promise<void> {
  // Public: get reviews for a master (paginated)
  app.get('/master/:masterId', reviewsController.getByMaster);

  // Authenticated: create a review
  app.post('/', { preHandler: [authenticate] }, reviewsController.create);

  // Authenticated: get my review for a specific master
  app.get('/my/:masterId', { preHandler: [authenticate] }, reviewsController.getMyReview);

  // Authenticated: update my review
  app.patch('/:reviewId', { preHandler: [authenticate] }, reviewsController.update);

  // Authenticated: delete my review (or admin)
  app.delete('/:reviewId', { preHandler: [authenticate] }, reviewsController.delete);
}
