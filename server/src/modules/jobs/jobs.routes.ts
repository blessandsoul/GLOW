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

  // Get job status (optional auth — guests access by job ID)
  app.get('/:jobId', { preHandler: [optionalAuth] }, jobsController.get);

  // Download job result
  app.get(
    '/:jobId/download',
    { preHandler: [optionalAuth] },
    jobsController.download,
  );
}
