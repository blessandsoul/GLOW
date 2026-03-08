import type { FastifyInstance } from 'fastify';
import { notificationsController } from './notifications.controller.js';

export async function notificationsRoutes(app: FastifyInstance): Promise<void> {
  // Public endpoint — no auth required (anyone can report a problem)
  app.post('/report', {
    config: { rateLimit: { max: 5, timeWindow: '5 minutes' } },
  }, notificationsController.reportProblem);
}
