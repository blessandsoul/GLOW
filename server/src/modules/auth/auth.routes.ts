import type { FastifyInstance } from 'fastify';
import { createAuthController } from './auth.controller.js';
import { createAuthService } from './auth.service.js';
import { authenticate } from '@/libs/auth.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = createAuthService(app);
  const controller = createAuthController(authService);

  app.post('/register', controller.register);
  // C5 fix: login brute-force — 10 attempts per IP per 15 min
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, controller.login);
  app.post('/refresh', controller.refresh);
  app.post('/logout', controller.logout);
  app.get('/me', { preHandler: [authenticate] }, controller.me);
  // Prevent password reset email bombing — 5 per IP per 15 min
  app.post('/request-password-reset', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, controller.requestPasswordReset);
  app.post('/reset-password', controller.resetPassword);
  app.post('/change-password/request-otp', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
  }, controller.changePasswordRequestOtp);
  app.post('/change-password', { preHandler: [authenticate] }, controller.changePassword);
  app.post('/verify-phone', { preHandler: [authenticate] }, controller.verifyPhone);
  // Prevent OTP/SMS flooding — 3 per IP per 15 min
  app.post('/resend-otp', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
  }, controller.resendOtp);

  // Phone-based password recovery (unauthenticated)
  app.post('/recover-password/request', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, controller.recoverPasswordRequest);
  app.post('/recover-password', controller.recoverPassword);

  // Google OAuth
  app.get('/google', controller.googleRedirect);
  app.get('/google/callback', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, controller.googleCallback);

  // Set phone (for Google users who don't have one yet)
  app.post('/set-phone', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
  }, controller.setPhone);
}
