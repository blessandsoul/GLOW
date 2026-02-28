import type { FastifyInstance } from 'fastify';
import { createProfilesController } from './profiles.controller.js';
import { createProfilesService } from './profiles.service.js';
import { authenticate, requirePhoneVerified } from '@/libs/auth.js';

export async function profilesRoutes(app: FastifyInstance): Promise<void> {
  const profilesService = createProfilesService();
  const controller = createProfilesController(profilesService);

  app.get('/me', { preHandler: [authenticate, requirePhoneVerified] }, controller.getMe);
  app.put('/me', { preHandler: [authenticate, requirePhoneVerified] }, controller.saveMe);
}
