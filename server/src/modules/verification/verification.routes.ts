import type { FastifyInstance } from 'fastify';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';
import { createVerificationController } from './verification.controller.js';
import { createVerificationService } from './verification.service.js';

export async function verificationRoutes(app: FastifyInstance): Promise<void> {
  const service = createVerificationService();
  const controller = createVerificationController(service);

  const userGuard = [authenticate, requirePhoneVerified];
  const adminGuard = [authenticate, authorize('ADMIN'), requirePhoneVerified];

  // Master-facing routes
  app.get('/state', { preHandler: userGuard }, controller.getState);
  app.post('/request', { preHandler: userGuard }, controller.requestVerification);
  app.post('/upload-id', { preHandler: userGuard }, controller.uploadIdDocument);
  app.post('/upload-certificate', { preHandler: userGuard }, controller.uploadCertificate);
  app.post('/upload-hygiene', { preHandler: userGuard }, controller.uploadHygienePics);
  app.post('/upload-quality-products', { preHandler: userGuard }, controller.uploadQualityProductsPics);

  // Admin-facing routes
  app.get('/admin/pending', { preHandler: adminGuard }, controller.adminGetPending);
  app.get('/admin/all', { preHandler: adminGuard }, controller.adminGetAll);
  app.post('/admin/:userId/review', { preHandler: adminGuard }, controller.adminReview);
  app.post('/admin/:userId/badge', { preHandler: adminGuard }, controller.adminSetBadge);
}
