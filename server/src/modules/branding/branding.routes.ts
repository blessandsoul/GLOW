import type { FastifyInstance } from 'fastify';
import { createBrandingController } from './branding.controller.js';
import { createBrandingService } from './branding.service.js';
import { authenticate } from '@/libs/auth.js';

export async function brandingRoutes(app: FastifyInstance): Promise<void> {
  const brandingService = createBrandingService();
  const controller = createBrandingController(brandingService);

  app.get('/me', { preHandler: [authenticate] }, controller.getMe);
  app.put('/me', { preHandler: [authenticate] }, controller.saveMe);
  app.delete('/me', { preHandler: [authenticate] }, controller.deleteMe);
}
