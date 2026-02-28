import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  RegisterSchema,
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  VerifyPhoneSchema,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { setAuthCookies, clearAuthCookies } from './auth.cookies.js';
import { UnauthorizedError } from '@/shared/errors/errors.js';

export function createAuthController(authService: AuthService) {
  return {
    async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RegisterSchema.parse(request.body);
      const result = await authService.register(input);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      reply.status(201).send(
        successResponse('Registration successful. Please verify your phone.', {
          user: result.user,
          otpRequestId: result.otpRequestId,
        }),
      );
    },

    async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = LoginSchema.parse(request.body);
      const result = await authService.login(input);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      reply.send(successResponse('Login successful', { user: result.user }));
    },

    async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token missing', 'MISSING_REFRESH_TOKEN');
      }
      const result = await authService.refresh(refreshToken);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      reply.send(successResponse('Token refreshed', null));
    },

    async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const refreshToken = request.cookies.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      clearAuthCookies(reply);
      reply.send(successResponse('Logged out successfully', null));
    },

    async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const user = await authService.getMe(request.user!.id);
      reply.send(successResponse('User retrieved', user));
    },

    async requestPasswordReset(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RequestPasswordResetSchema.parse(request.body);
      await authService.requestPasswordReset(input);
      reply.send(successResponse('Reset email sent', null));
    },

    async resetPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = ResetPasswordSchema.parse(request.body);
      await authService.resetPassword(input);
      clearAuthCookies(reply);
      reply.send(successResponse('Password reset successful', null));
    },

    async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = ChangePasswordSchema.parse(request.body);
      await authService.changePassword(request.user!.id, input);
      clearAuthCookies(reply);
      reply.send(successResponse('Password changed', null));
    },

    async verifyPhone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = VerifyPhoneSchema.parse(request.body);
      const user = await authService.verifyPhone(
        request.user!.id,
        input.requestId,
        input.code,
        request.ip,
      );
      reply.send(successResponse('Phone verified successfully', { user }));
    },

    async resendOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const result = await authService.resendOtp(request.user!.id);
      reply.send(successResponse('Verification code sent', { requestId: result.requestId }));
    },
  };
}
