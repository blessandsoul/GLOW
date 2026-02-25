import type { FastifyInstance } from 'fastify';
import { subscriptionsController } from './subscriptions.controller.js';
import { authenticate } from '@/libs/auth.js';

export async function subscriptionsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/plans', subscriptionsController.getPlans);
  app.get(
    '/current',
    { preHandler: [authenticate] },
    subscriptionsController.getCurrent,
  );
  app.post(
    '/subscribe',
    { preHandler: [authenticate] },
    subscriptionsController.subscribe,
  );
  app.post(
    '/cancel',
    { preHandler: [authenticate] },
    subscriptionsController.cancel,
  );
  app.post(
    '/reactivate',
    { preHandler: [authenticate] },
    subscriptionsController.reactivate,
  );
}
