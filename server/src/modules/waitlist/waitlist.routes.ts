import type { FastifyInstance } from 'fastify';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';
import { createWaitlistController } from './waitlist.controller.js';
import { waitlistService } from './waitlist.service.js';

export async function waitlistRoutes(app: FastifyInstance): Promise<void> {
  const controller = createWaitlistController(waitlistService);

  const masterGuard = [authenticate, authorize('MASTER'), requirePhoneVerified];

  // ── Public (UNauthenticated), rate-limited + OTP-gated ──
  app.get('/public/:username/services', controller.getPublicServices);

  app.post(
    '/public/:username/request-otp',
    { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } },
    controller.requestJoinOtp,
  );

  app.post(
    '/public/:username/join',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    controller.verifyAndJoin,
  );

  // ── Master-facing (authenticated MASTER) ──
  app.get('/me', { preHandler: masterGuard }, controller.listMine);
  app.get('/me/summary', { preHandler: masterGuard }, controller.summaryMine);
  app.patch('/me/:id/status', { preHandler: masterGuard }, controller.updateStatus);
}
