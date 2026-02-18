import type { FastifyInstance } from 'fastify';
import { jobsController } from './jobs.controller.js';
import { optionalAuth } from '../../libs/auth.js';

export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/:jobId/download',
    { preHandler: [optionalAuth] },
    jobsController.download,
  );
}
