import type { FastifyInstance } from 'fastify';
import { jobsController } from './jobs.controller.js';
import { authenticate, optionalAuth } from '../../libs/auth.js';

export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  // Authenticated job creation
  app.post('/', { preHandler: [authenticate] }, jobsController.create);

  // Batch job creation (PRO users — authenticated required)
  app.post('/batch', { preHandler: [authenticate] }, jobsController.createBatch);

  // Guest demo creation (no auth required)
  app.post('/guest', jobsController.createGuest);

  // List user's jobs (authenticated)
  app.get('/', { preHandler: [authenticate] }, jobsController.list);

  // List flat result images for portfolio picker (authenticated)
  app.get('/results', { preHandler: [authenticate] }, jobsController.listResults);

  // Dashboard stats (authenticated) — MUST be before /:jobId
  app.get('/stats', { preHandler: [authenticate] }, jobsController.stats);

  // Bulk delete jobs (authenticated) — MUST be before /:jobId
  app.delete('/bulk', { preHandler: [authenticate] }, jobsController.bulkDelete);

  // Get job status (optional auth — guests access by job ID)
  app.get('/:jobId', { preHandler: [optionalAuth] }, jobsController.get);

  // Download job result
  app.get(
    '/:jobId/download',
    { preHandler: [optionalAuth] },
    jobsController.download,
  );

  // Delete single job (authenticated)
  app.delete('/:jobId', { preHandler: [authenticate] }, jobsController.delete);
}
