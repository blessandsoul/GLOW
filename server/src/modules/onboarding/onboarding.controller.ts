import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { CompleteOnboardingSchema } from './onboarding.schemas.js';
import { env } from '@/config/env.js';
import type { OnboardingService } from './onboarding.service.js';

export function createOnboardingController(service: OnboardingService) {
  return {
    async complete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = CompleteOnboardingSchema.parse(request.body);
      const user = await service.complete(request.user.id, input);

      reply.setCookie('onboardingCompleted', '1', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
      });

      reply.send(successResponse('Onboarding completed', { user }));
    },
  };
}
