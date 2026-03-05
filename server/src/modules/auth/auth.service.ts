import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
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
  ChangePasswordRequestOtpInput,
  ChangePasswordInput,
  RecoverPasswordRequestInput,
  RecoverPasswordInput,
} from './auth.schemas.js';
import type { JwtPayload } from '@/shared/types/index.js';
import { referralsService } from '@/modules/referrals/referrals.service.js';
import { prisma } from '@/libs/prisma.js';
import { logger } from '@/libs/logger.js';
import { scheduleEmailSequence } from '@/libs/queue.js';
import { sendEmail } from '@/libs/email.js';

const SALT_ROUNDS = 12;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const RECOVERY_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

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

function maskPhone(phone: string): string {
  // +995599123456 -> "+995 5** *** *56"
  return `+995 ${phone[4]}** *** *${phone.slice(-2)}`;
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

      if (input.phone) {
        const existingPhone = await authRepo.findUserByPhone(input.phone);
        if (existingPhone) {
          throw new ConflictError('Phone number already registered', 'PHONE_ALREADY_EXISTS');
        }
      }

      // Send OTP BEFORE creating the user so a failed OTP never leaves an orphaned account
      let otpRequestId: string | null = null;
      if (input.phone) {
        const otpResult = await sendOtp(input.phone);
        otpRequestId = otpResult.requestId;
      }

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      const user = await authRepo.createUser({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        ...(input.phone ? { phone: input.phone } : {}),
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

      if (otpRequestId) {
        await authRepo.setOtpRequestId(user.id, otpRequestId);
      } else {
        // No phone → grant referral rewards immediately (no verification step)
        referralsService.grantPendingRewards(user.id)
          .catch((err: unknown) => logger.warn({ err, userId: user.id }, 'Failed to grant referral rewards on register'));
      }

      const accessToken = signAccessToken({ id: user.id, role: user.role });
      const refreshToken = await generateRefreshToken(user.id);

      return { user: mapUserToResponse({ ...user, hasPassword: true }), accessToken, refreshToken, otpRequestId };
    },

    async login(input: LoginInput) {
      const user = await authRepo.findUserByEmail(input.email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      if (!user.password) {
        throw new UnauthorizedError('This account uses Google sign-in. Please use the Google button to log in.', 'USE_GOOGLE_LOGIN');
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

      return { user: mapUserToResponse({ ...safeUser!, hasPassword: true }), accessToken, refreshToken };
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

      // H5 fix: reject refresh for deactivated or soft-deleted accounts
      const { user } = storedToken;
      if (!user.isActive || user.deletedAt) {
        await authRepo.deleteRefreshToken(refreshTokenValue);
        throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
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

      const pwStatus = await authRepo.getUserPasswordStatus(userId);
      return mapUserToResponse({ ...user, hasPassword: pwStatus?.password !== null });
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

    async changePasswordRequestOtp(userId: string, input: ChangePasswordRequestOtpInput) {
      const user = await authRepo.findUserByEmail(
        (await authRepo.findUserById(userId))?.email ?? '',
      );

      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }

      // If user has a password, verify current password before sending OTP
      if (user.password) {
        if (!input.currentPassword) {
          throw new BadRequestError('Current password is required', 'CURRENT_PASSWORD_REQUIRED');
        }
        const isValid = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValid) {
          throw new BadRequestError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
        }
      }
      // If user has no password (Google OAuth), skip current password check — this is "set password"

      if (!user.phone) {
        throw new BadRequestError('A verified phone number is required to change your password', 'NO_PHONE_NUMBER');
      }
      if (!user.phoneVerified) {
        throw new BadRequestError('Please verify your phone number first', 'PHONE_NOT_VERIFIED');
      }

      const otpResult = await sendOtp(user.phone);
      return { requestId: otpResult.requestId };
    },

    async changePassword(userId: string, input: ChangePasswordInput) {
      const user = await authRepo.findUserByEmail(
        (await authRepo.findUserById(userId))?.email ?? '',
      );

      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }

      // If user has a password, verify current password
      if (user.password) {
        if (!input.currentPassword) {
          throw new BadRequestError('Current password is required', 'CURRENT_PASSWORD_REQUIRED');
        }
        const isValid = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValid) {
          throw new BadRequestError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
        }
      }
      // If user has no password (Google OAuth setting password), skip current password check

      if (!user.phone || !user.phoneVerified) {
        throw new BadRequestError('A verified phone number is required', 'PHONE_NOT_VERIFIED');
      }

      // Verify OTP code (phone comes from DB, not client input)
      await verifyOtp(user.phone, input.otpRequestId, input.code);

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

      await verifyOtp(user.phone!, requestId, code);

      const updatedUser = await authRepo.setPhoneVerified(userId);

      // Grant pending referral rewards (fire-and-forget, non-fatal)
      referralsService.grantPendingRewards(userId)
        .catch((err: unknown) => logger.warn({ err, userId }, 'Failed to grant referral rewards on phone verify'));

      const pwStatus = await authRepo.getUserPasswordStatus(userId);
      return mapUserToResponse({ ...updatedUser, hasPassword: pwStatus?.password !== null });
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

    async googleAuth(code: string, referralCode?: string) {
      const oauth2Client = new OAuth2Client(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_CALLBACK_URL,
      );

      const { tokens } = await oauth2Client.getToken(code);
      if (!tokens.id_token) {
        throw new BadRequestError('Google authentication failed', 'GOOGLE_AUTH_FAILED');
      }

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new BadRequestError('Google account has no email', 'GOOGLE_NO_EMAIL');
      }

      const { sub: googleId, email, given_name, family_name, picture } = payload;

      // Case A: User with this googleId already exists — log in
      const existingByGoogle = await authRepo.findUserByGoogleId(googleId);
      if (existingByGoogle) {
        if (!existingByGoogle.isActive || existingByGoogle.deletedAt) {
          throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
        }
        const safeUser = await authRepo.findUserById(existingByGoogle.id);
        if (safeUser && !safeUser.username) {
          safeUser.username = await authRepo.backfillUsername(safeUser.id, safeUser.firstName, safeUser.lastName);
        }
        const accessToken = signAccessToken({ id: existingByGoogle.id, role: existingByGoogle.role });
        const refreshToken = await generateRefreshToken(existingByGoogle.id);
        return {
          user: mapUserToResponse({ ...safeUser!, hasPassword: existingByGoogle.password !== null }),
          accessToken,
          refreshToken,
        };
      }

      // Case B: User with this email exists but no googleId — auto-link
      const existingByEmail = await authRepo.findUserByEmail(email);
      if (existingByEmail) {
        if (!existingByEmail.isActive || existingByEmail.deletedAt) {
          throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
        }
        await authRepo.linkGoogleId(existingByEmail.id, googleId, existingByEmail.avatar ? null : picture);
        const safeUser = await authRepo.findUserById(existingByEmail.id);
        if (safeUser && !safeUser.username) {
          safeUser.username = await authRepo.backfillUsername(safeUser.id, safeUser.firstName, safeUser.lastName);
        }
        const accessToken = signAccessToken({ id: existingByEmail.id, role: existingByEmail.role });
        const refreshToken = await generateRefreshToken(existingByEmail.id);
        return {
          user: mapUserToResponse({ ...safeUser!, hasPassword: existingByEmail.password !== null }),
          accessToken,
          refreshToken,
        };
      }

      // Case C: Brand new user — create without password
      const newUser = await authRepo.createGoogleUser({
        email,
        googleId,
        firstName: given_name ?? 'User',
        lastName: family_name ?? '',
        avatar: picture ?? null,
      });

      // Generate and save referral code
      const newReferralCode = referralsService.generateCode();
      await prisma.user.update({
        where: { id: newUser.id },
        data: { referralCode: newReferralCode },
      });

      // Apply referral if code provided (non-fatal)
      if (referralCode) {
        await referralsService.applyReferralOnRegister(newUser.id, referralCode, undefined);
      }

      // Schedule post-registration email sequence (fire-and-forget)
      scheduleEmailSequence(newUser.id).catch((err: unknown) =>
        logger.warn({ err }, 'Failed to schedule email sequence for Google user'),
      );

      const accessToken = signAccessToken({ id: newUser.id, role: newUser.role });
      const refreshToken = await generateRefreshToken(newUser.id);

      return {
        user: mapUserToResponse({ ...newUser, hasPassword: false }),
        accessToken,
        refreshToken,
      };
    },

    async recoverPasswordRequest(input: RecoverPasswordRequestInput) {
      const user = await authRepo.findUserByEmail(input.email);

      if (!user || !user.phone || !user.phoneVerified) {
        throw new BadRequestError(
          'Password recovery requires a verified phone number',
          'PHONE_NOT_VERIFIED',
        );
      }

      const otpResult = await sendOtp(user.phone);
      const recoveryToken = randomUUID();
      const hashedToken = hashToken(recoveryToken);
      const expiry = new Date(Date.now() + RECOVERY_EXPIRY_MS);

      await authRepo.setPasswordResetToken(user.id, hashedToken, expiry);
      await authRepo.setOtpRequestId(user.id, otpResult.requestId);

      return {
        recoveryToken,
        requestId: otpResult.requestId,
        maskedPhone: maskPhone(user.phone),
      };
    },

    async recoverPassword(input: RecoverPasswordInput) {
      const hashedToken = hashToken(input.recoveryToken);
      const user = await authRepo.findUserByResetToken(hashedToken);

      if (!user) {
        throw new BadRequestError('Invalid or expired recovery session', 'INVALID_RECOVERY_TOKEN');
      }

      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        await authRepo.clearPasswordResetToken(user.id);
        throw new BadRequestError('Recovery session has expired', 'RECOVERY_TOKEN_EXPIRED');
      }

      await verifyOtp(user.phone!, input.requestId, input.code);

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      await authRepo.updatePassword(user.id, hashedPassword);
      await authRepo.clearPasswordResetToken(user.id);
      await authRepo.deleteUserRefreshTokens(user.id);
    },

    async setPhone(userId: string, phone: string) {
      const user = await authRepo.findUserById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }
      if (user.phone) {
        throw new BadRequestError('Phone number already set', 'PHONE_ALREADY_SET');
      }

      // Check phone uniqueness
      const existingPhone = await authRepo.findUserByPhone(phone);
      if (existingPhone) {
        throw new ConflictError('Phone number already registered', 'PHONE_ALREADY_EXISTS');
      }

      // Send OTP
      const otpResult = await sendOtp(phone);

      // Update user's phone and store OTP request ID
      await authRepo.setUserPhone(userId, phone, otpResult.requestId);

      return { requestId: otpResult.requestId };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
