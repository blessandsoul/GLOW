import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { FastifyInstance } from 'fastify';
import { authRepo } from './auth.repo.js';
import { ConflictError, UnauthorizedError } from '@/shared/errors/errors.js';
import { env } from '@/config/env.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';
import type { JwtPayload } from '@/shared/types/index.js';

const SALT_ROUNDS = 12;

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

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      const user = await authRepo.createUser({
        ...input,
        password: hashedPassword,
      });

      const accessToken = signAccessToken({ id: user.id, role: user.role });
      const refreshToken = await generateRefreshToken(user.id);

      return { user, accessToken, refreshToken };
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

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, accessToken, refreshToken };
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
      return user;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
