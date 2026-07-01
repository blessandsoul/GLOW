import type { FastifyInstance } from 'fastify';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';
import { createBookingController } from './booking.controller.js';
import { bookingService } from './booking.service.js';

export async function bookingRoutes(app: FastifyInstance): Promise<void> {
  const controller = createBookingController(bookingService);
  const masterGuard = [authenticate, authorize('MASTER'), requirePhoneVerified];

  // ── Public (UNauthenticated), rate-limited + OTP-gated ──
  // Public GETs are per-IP rate-limited too: without this a scraper can walk usernames
  // (enumeration) and harvest every master's availability + service prices at will.
  app.get(
    '/public/:username/services',
    { config: { rateLimit: { max: 60, timeWindow: '15 minutes' } } },
    controller.getServices,
  );
  app.get(
    '/public/:username/slots',
    { config: { rateLimit: { max: 60, timeWindow: '15 minutes' } } },
    controller.getSlots,
  );
  app.post(
    '/public/:username/request-otp',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    controller.requestOtp,
  );
  app.post(
    '/public/:username/book',
    { config: { rateLimit: { max: 8, timeWindow: '15 minutes' } } },
    controller.book,
  );
  // Flitt payment webhook (server-to-server, signature-verified inside the service, no auth/rate-limit).
  app.post('/payment/callback', controller.paymentCallback);

  // ── Master-facing ──
  app.get('/me', { preHandler: masterGuard }, controller.listMine);
  app.get('/me/summary', { preHandler: masterGuard }, controller.summaryMine);
  app.patch('/me/:id/status', { preHandler: masterGuard }, controller.updateStatus);
  app.post('/me/:id/deposit-received', { preHandler: masterGuard }, controller.depositReceived);
}
