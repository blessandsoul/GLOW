import type { FastifyInstance } from 'fastify';
import { subscriptionsController } from './subscriptions.controller.js';
import { authenticate, requirePhoneVerified } from '@/libs/auth.js';

export async function subscriptionsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/plans', subscriptionsController.getPlans);
  app.get(
    '/current',
    { preHandler: [authenticate, requirePhoneVerified] },
    subscriptionsController.getCurrent,
  );
  app.post(
    '/subscribe',
    { preHandler: [authenticate, requirePhoneVerified] },
    subscriptionsController.subscribe,
  );
  app.post(
    '/cancel',
    { preHandler: [authenticate, requirePhoneVerified] },
    subscriptionsController.cancel,
  );
  app.post(
    '/reactivate',
    { preHandler: [authenticate, requirePhoneVerified] },
    subscriptionsController.reactivate,
  );
}
