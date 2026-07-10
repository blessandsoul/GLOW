import type { FastifyInstance } from 'fastify';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';
import { createPaymentsController } from './payments.controller.js';
import { paymentsService } from './payments.instance.js';

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  const controller = createPaymentsController(paymentsService);
  const masterGuard = [authenticate, authorize('MASTER'), requirePhoneVerified];
  const adminGuard = [authenticate, authorize('ADMIN'), requirePhoneVerified];

  app.get('/manage/:token', {
    config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
  }, controller.getManagedBooking);
  app.post('/manage/:token/cancel', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, controller.cancelManagedBooking);

  app.post('/me/bookings/:id/cancel', { preHandler: masterGuard }, controller.cancelMasterBooking);
  app.post('/me/bookings/:id/no-show', { preHandler: masterGuard }, controller.markNoShow);
  app.get('/me/balance', { preHandler: masterGuard }, controller.masterBalance);

  app.get('/admin/refunds', { preHandler: adminGuard }, controller.adminRefunds);
  app.post('/admin/bookings/:id/cancel', { preHandler: adminGuard }, controller.adminCancelBooking);
  app.get('/admin/payments', { preHandler: adminGuard }, controller.adminPayments);
  app.post('/admin/payments/:id/refunds', { preHandler: adminGuard }, controller.adminCreateRefund);
  app.post('/admin/refunds/:id/retry', { preHandler: adminGuard }, controller.adminRetryRefund);
  app.post('/admin/refunds/:id/reconcile', { preHandler: adminGuard }, controller.adminReconcileRefund);
  app.post('/admin/payments/:id/reconcile', { preHandler: adminGuard }, controller.adminReconcilePayment);
  app.get('/admin/payouts/candidates', { preHandler: adminGuard }, controller.adminPayoutCandidates);
  app.get('/admin/payouts', { preHandler: adminGuard }, controller.adminPayouts);
  app.post('/admin/ledger/master/:masterProfileId/adjustments', { preHandler: adminGuard }, controller.adminCreateAdjustment);
  app.post('/admin/payouts/master/:masterProfileId', { preHandler: adminGuard }, controller.adminCreatePayout);
  app.post('/admin/payouts/:id/paid', { preHandler: adminGuard }, controller.adminMarkPayoutPaid);
}
