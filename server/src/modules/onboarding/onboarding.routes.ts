import type { FastifyInstance } from 'fastify';
import { authenticate } from '@/libs/auth.js';
import { createOnboardingService } from './onboarding.service.js';
import { createOnboardingController } from './onboarding.controller.js';

export async function onboardingRoutes(app: FastifyInstance): Promise<void> {
  const service = createOnboardingService();
  const controller = createOnboardingController(service);

  app.post('/complete', { preHandler: [authenticate] }, controller.complete);
}
