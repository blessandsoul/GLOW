import type { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';
import { successResponse } from '@/shared/responses/successResponse.js';

export function createAuthController(authService: AuthService) {
  return {
    async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RegisterSchema.parse(request.body);
      const result = await authService.register(input);
      reply.status(201).send(
        successResponse('Registration successful', result),
      );
    },

    async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = LoginSchema.parse(request.body);
      const result = await authService.login(input);
      reply.send(successResponse('Login successful', result));
    },

    async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RefreshSchema.parse(request.body);
      const result = await authService.refresh(input.refreshToken);
      reply.send(successResponse('Token refreshed', result));
    },

    async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RefreshSchema.parse(request.body);
      await authService.logout(input.refreshToken);
      reply.send(successResponse('Logged out successfully', null));
    },

    async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const user = await authService.getMe(request.user!.id);
      reply.send(successResponse('User retrieved', user));
    },
  };
}
