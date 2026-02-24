import type { FastifyRequest, FastifyReply } from 'fastify';
import { SubscribeSchema } from './subscriptions.schemas.js';
import { subscriptionsService } from './subscriptions.service.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { JwtPayload } from '@/shared/types/index.js';

export const subscriptionsController = {
  async getPlans(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const plans = subscriptionsService.getPlans();
    reply.send(successResponse('Plans retrieved', plans));
  },

  async getCurrent(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user as JwtPayload;
    const subscription = await subscriptionsService.getCurrent(user.id);
    reply.send(
      successResponse('Current subscription retrieved', subscription),
    );
  },

  async subscribe(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user as JwtPayload;
    const { plan, quality } = SubscribeSchema.parse(request.body);
    const subscription = await subscriptionsService.subscribe(
      user.id,
      plan,
      quality,
    );
    reply
      .status(201)
      .send(successResponse('Subscription activated', subscription));
  },

  async cancel(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user as JwtPayload;
    const subscription = await subscriptionsService.cancel(user.id);
    reply.send(successResponse('Subscription cancelled', subscription));
  },

  async reactivate(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user as JwtPayload;
    const subscription = await subscriptionsService.reactivate(user.id);
    reply.send(successResponse('Subscription reactivated', subscription));
  },
};
