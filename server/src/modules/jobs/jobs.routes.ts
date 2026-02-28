import type { FastifyInstance } from 'fastify';
import { jobsController } from './jobs.controller.js';
import { authenticate, optionalAuth, requirePhoneVerified } from '../../libs/auth.js';

export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  // Authenticated job creation
  app.post('/', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.create);

  // Batch job creation (PRO users — authenticated required)
  app.post('/batch', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.createBatch);

  // Guest demo creation (no auth required)
  app.post('/guest', jobsController.createGuest);

  // List user's jobs (authenticated)
  app.get('/', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.list);

  // List flat result images for portfolio picker (authenticated)
  app.get('/results', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.listResults);

  // Dashboard stats (authenticated) — MUST be before /:jobId
  app.get('/stats', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.stats);

  // Daily usage stats for launch mode (authenticated)
  app.get('/daily-usage', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.dailyUsage);

  // Bulk delete jobs (authenticated) — MUST be before /:jobId
  app.delete('/bulk', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.bulkDelete);

  // Get job status (optional auth — guests access by job ID)
  app.get('/:jobId', { preHandler: [optionalAuth] }, jobsController.get);

  // Download job result
  app.get(
    '/:jobId/download',
    { preHandler: [optionalAuth] },
    jobsController.download,
  );

  // Delete single job (authenticated)
  app.delete('/:jobId', { preHandler: [authenticate, requirePhoneVerified] }, jobsController.delete);
}
