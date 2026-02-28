import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { FastifyInstance } from 'fastify';
import { authRepo, mapUserToResponse } from './auth.repo.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '@/shared/errors/errors.js';
import { sendOtp, verifyOtp } from '@/libs/otp.js';
import { env } from '@/config/env.js';
import type {
  RegisterInput,
  LoginInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.schemas.js';
import type { JwtPayload } from '@/shared/types/index.js';
import { referralsService } from '@/modules/referrals/referrals.service.js';
import { prisma } from '@/libs/prisma.js';
import { logger } from '@/libs/logger.js';
import { scheduleEmailSequence } from '@/libs/queue.js';
import { sendEmail } from '@/libs/email.js';

const SALT_ROUNDS = 12;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(m|h|d)$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes
  const [, num, unit] = match;
  const value = parseInt(num, 10);
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}

export function createAuthService(app: FastifyInstance) {
  function signAccessToken(payload: JwtPayload): string {
    return app.jwt.sign(payload, { expiresIn: env.JWT_ACCESS_EXPIRY });
  }

  async function generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRY));
    await authRepo.createRefreshToken({ token, userId, expiresAt });
    return token;
  }

  return {
    async register(input: RegisterInput) {
      const existing = await authRepo.findUserByEmail(input.email);
      if (existing) {
        throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
      }

      const existingPhone = await authRepo.findUserByPhone(input.phone);
      if (existingPhone) {
        throw new ConflictError('Phone number already registered', 'PHONE_ALREADY_EXISTS');
      }

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      const user = await authRepo.createUser({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      });

      // Generate and save referral code for new user
      const referralCode = referralsService.generateCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode },
      });

      // Apply referral if code provided (non-fatal, internal try/catch)
      await referralsService.applyReferralOnRegister(user.id, input.referralCode, input.phone);

      // Schedule post-registration email sequence (fire-and-forget, non-fatal)
      scheduleEmailSequence(user.id).catch((err: unknown) =>
        logger.warn({ err }, 'Failed to schedule email sequence'),
      );

      // Send phone verification OTP
      const otpResult = await sendOtp(input.phone);
      await authRepo.setOtpRequestId(user.id, otpResult.requestId);

      const accessToken = signAccessToken({ id: user.id, role: user.role });
      const refreshToken = await generateRefreshToken(user.id);

      return { user: mapUserToResponse(user), accessToken, refreshToken, otpRequestId: otpResult.requestId };
    },

    async login(input: LoginInput) {
      const user = await authRepo.findUserByEmail(input.email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      const isPasswordValid = await bcrypt.compare(input.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      const accessToken = signAccessToken({ id: user.id, role: user.role });
      const refreshToken = await generateRefreshToken(user.id);

      // Re-fetch with select to ensure consistent response shape
      const safeUser = await authRepo.findUserById(user.id);

      // Backfill username for existing users who don't have one
      if (safeUser && !safeUser.username) {
        safeUser.username = await authRepo.backfillUsername(safeUser.id, safeUser.firstName, safeUser.lastName);
      }

      return { user: mapUserToResponse(safeUser!), accessToken, refreshToken };
    },

    async refresh(refreshTokenValue: string) {
      const storedToken = await authRepo.findRefreshToken(refreshTokenValue);

      if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      if (storedToken.expiresAt < new Date()) {
        await authRepo.deleteRefreshToken(refreshTokenValue);
        throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
      }

      // Rotate refresh token
      await authRepo.deleteRefreshToken(refreshTokenValue);

      const accessToken = signAccessToken({
        id: storedToken.user.id,
        role: storedToken.user.role,
      });
      const newRefreshToken = await generateRefreshToken(storedToken.user.id);

      return { accessToken, refreshToken: newRefreshToken };
    },

    async logout(refreshTokenValue: string) {
      await authRepo.deleteRefreshToken(refreshTokenValue);
    },

    async getMe(userId: string) {
      const user = await authRepo.findUserById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }

      // Backfill username for existing users who don't have one
      if (!user.username) {
        user.username = await authRepo.backfillUsername(user.id, user.firstName, user.lastName);
      }

      return mapUserToResponse(user);
    },

    async requestPasswordReset(input: RequestPasswordResetInput) {
      const user = await authRepo.findUserByEmail(input.email);

      // Always return success for security (don't reveal if email exists)
      if (!user) return;

      const rawToken = randomUUID();
      const hashedToken = hashToken(rawToken);
      const expiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

      await authRepo.setPasswordResetToken(user.id, hashedToken, expiry);

      const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
      await sendEmail(
        user.email,
        'Reset your password — GLOW',
        `<p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
      );
    },

    async resetPassword(input: ResetPasswordInput) {
      const hashedToken = hashToken(input.token);
      const user = await authRepo.findUserByResetToken(hashedToken);

      if (!user) {
        throw new BadRequestError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
      }

      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        await authRepo.clearPasswordResetToken(user.id);
        throw new BadRequestError('Reset token has expired', 'RESET_TOKEN_EXPIRED');
      }

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      await authRepo.updatePassword(user.id, hashedPassword);
      await authRepo.clearPasswordResetToken(user.id);
      await authRepo.deleteUserRefreshTokens(user.id);
    },

    async changePassword(userId: string, input: ChangePasswordInput) {
      const user = await authRepo.findUserByEmail(
        // Need full user with password for comparison
        (await authRepo.findUserById(userId))?.email ?? '',
      );

      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await authRepo.updatePassword(userId, hashedPassword);
      await authRepo.deleteUserRefreshTokens(userId);
    },

    async verifyPhone(userId: string, requestId: string, code: string, ipAddress: string) {
      const user = await authRepo.findUserById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }
      if (user.phoneVerified) {
        throw new BadRequestError('Phone already verified', 'PHONE_ALREADY_VERIFIED');
      }

      await verifyOtp(requestId, code, ipAddress);

      const updatedUser = await authRepo.setPhoneVerified(userId);

      // Grant pending referral rewards (fire-and-forget, non-fatal)
      referralsService.grantPendingRewards(userId)
        .catch((err: unknown) => logger.warn({ err, userId }, 'Failed to grant referral rewards on phone verify'));

      return mapUserToResponse(updatedUser);
    },

    async resendOtp(userId: string) {
      const user = await authRepo.findUserById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }
      if (user.phoneVerified) {
        throw new BadRequestError('Phone already verified', 'PHONE_ALREADY_VERIFIED');
      }
      if (!user.phone) {
        throw new BadRequestError('No phone number on file', 'NO_PHONE_NUMBER');
      }

      const otpResult = await sendOtp(user.phone);
      await authRepo.setOtpRequestId(userId, otpResult.requestId);

      return { requestId: otpResult.requestId };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
