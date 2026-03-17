import { randomBytes } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import {
  RegisterSchema,
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  ChangePasswordRequestOtpSchema,
  ChangePasswordSchema,
  VerifyPhoneSchema,
  SetPhoneSchema,
  RecoverPasswordRequestSchema,
  RecoverPasswordSchema,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { setAuthCookies, clearAuthCookies } from './auth.cookies.js';
import { UnauthorizedError } from '@/shared/errors/errors.js';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';

export function createAuthController(authService: AuthService) {
  return {
    async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RegisterSchema.parse(request.body);
      const result = await authService.register(input);
      setAuthCookies(reply, result.accessToken, result.refreshToken, result.user.onboardingCompleted);
      const message = result.otpRequestId
        ? 'Registration successful. Please verify your phone.'
        : 'Registration successful';
      reply.status(201).send(
        successResponse(message, {
          user: result.user,
          ...(result.otpRequestId ? { otpRequestId: result.otpRequestId } : {}),
        }),
      );
    },

    async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = LoginSchema.parse(request.body);
      const result = await authService.login(input);
      setAuthCookies(reply, result.accessToken, result.refreshToken, result.user.onboardingCompleted);
      reply.send(successResponse('Login successful', { user: result.user }));
    },

    async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token missing', 'MISSING_REFRESH_TOKEN');
      }
      const result = await authService.refresh(refreshToken);
      setAuthCookies(reply, result.accessToken, result.refreshToken, result.onboardingCompleted);
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

    async changePasswordRequestOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = ChangePasswordRequestOtpSchema.parse(request.body);
      const result = await authService.changePasswordRequestOtp(request.user!.id, input);
      reply.send(successResponse('Verification code sent', { requestId: result.requestId }));
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

    async googleRedirect(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { ref } = request.query as { ref?: string };
      const state = randomBytes(32).toString('hex') + (ref ? `:${ref}` : '');

      reply.setCookie('oauth_state', state, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 300,
        ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
      });

      const oauth2Client = new OAuth2Client(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_CALLBACK_URL,
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile'],
        state,
        prompt: 'select_account',
      });

      reply.redirect(authUrl);
    },

    async googleCallback(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { code, state, error: googleError } = request.query as {
        code?: string;
        state?: string;
        error?: string;
      };

      // Clear the state cookie regardless of outcome
      reply.clearCookie('oauth_state', {
        path: '/api/v1/auth',
        ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
      });

      if (googleError) {
        reply.redirect(`${env.APP_URL}/login?error=google_denied`);
        return;
      }

      // Validate CSRF state
      const storedState = request.cookies.oauth_state;
      if (!state || !storedState || state !== storedState) {
        reply.redirect(`${env.APP_URL}/login?error=google_failed`);
        return;
      }

      if (!code) {
        reply.redirect(`${env.APP_URL}/login?error=google_failed`);
        return;
      }

      // Extract referral code from state if present
      const colonIndex = state.indexOf(':', 64); // state is 64 hex chars + optional :ref
      const referralCode = colonIndex > 0 ? state.slice(colonIndex + 1) : undefined;

      try {
        const result = await authService.googleAuth(code, referralCode);
        setAuthCookies(reply, result.accessToken, result.refreshToken, result.user.onboardingCompleted);

        if (!result.user.onboardingCompleted) {
          reply.redirect(`${env.APP_URL}/onboarding`);
        } else if (!result.user.isPhoneVerified) {
          reply.redirect(`${env.APP_URL}/verify-phone`);
        } else {
          reply.redirect(`${env.APP_URL}/dashboard`);
        }
      } catch (err) {
        logger.error({ err }, 'Google OAuth callback failed');
        reply.redirect(`${env.APP_URL}/login?error=google_failed`);
      }
    },

    async recoverPasswordRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RecoverPasswordRequestSchema.parse(request.body);
      const result = await authService.recoverPasswordRequest(input);
      reply.send(successResponse('Recovery code sent', {
        recoveryToken: result.recoveryToken,
        requestId: result.requestId,
        maskedPhone: result.maskedPhone,
      }));
    },

    async recoverPassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RecoverPasswordSchema.parse(request.body);
      await authService.recoverPassword(input);
      clearAuthCookies(reply);
      reply.send(successResponse('Password reset successful', null));
    },

    async setPhone(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = SetPhoneSchema.parse(request.body);
      const result = await authService.setPhone(request.user!.id, input.phone);
      reply.send(successResponse('Verification code sent', { requestId: result.requestId }));
    },
  };
}
