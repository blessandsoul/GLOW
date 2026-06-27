import type { FastifyInstance } from 'fastify';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';
import { facesController } from './faces.controller.js';

export async function facesRoutes(app: FastifyInstance): Promise<void> {
  const masterView = [authenticate, authorize('MASTER', 'ADMIN')];
  const masterOnly = [authenticate, authorize('MASTER')];
  const ownerGuard = [authenticate, requirePhoneVerified];
  const adminGuard = [authenticate, authorize('ADMIN'), requirePhoneVerified];

  // ── Owner (model self-service), declared before /:id so static paths win ──
  app.get('/me', { preHandler: [authenticate] }, facesController.getMe);
  app.patch('/me', { preHandler: ownerGuard }, facesController.updateMe);
  app.post('/photos', { preHandler: ownerGuard }, facesController.uploadPhoto);
  app.delete('/photos/:photoId', { preHandler: ownerGuard }, facesController.deletePhoto);
  app.patch('/photos/:photoId/primary', { preHandler: ownerGuard }, facesController.setPrimaryPhoto);
  app.post('/request-review', { preHandler: ownerGuard }, facesController.requestReview);
  app.post('/blur', { preHandler: [authenticate] }, facesController.blur);
  app.post('/unblur', { preHandler: [authenticate] }, facesController.unblur);
  app.post('/withdraw', { preHandler: [authenticate] }, facesController.withdraw);

  // ── Admin moderation ──
  app.get('/admin/pending', { preHandler: adminGuard }, facesController.adminGetPending);
  app.post('/admin/:userId/review', { preHandler: adminGuard }, facesController.adminReview);
  app.post('/admin/photos/:photoId/review', { preHandler: adminGuard }, facesController.adminPhotoReview);

  // ── Catalog (master-facing, never public) ──
  app.get('/catalog', { preHandler: masterView }, facesController.getCatalog);
  app.get('/interest/status', { preHandler: masterOnly }, facesController.getInterestStatus);
  app.get('/:id', { preHandler: masterView }, facesController.getDetail);
  app.post('/:id/interest', { preHandler: masterOnly }, facesController.addInterest);
  app.delete('/:id/interest', { preHandler: masterOnly }, facesController.removeInterest);
}
