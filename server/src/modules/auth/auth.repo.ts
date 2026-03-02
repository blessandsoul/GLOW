import { prisma } from '@/libs/prisma.js';

export const USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  username: true,
  avatar: true,
  role: true,
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  credits: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface RawSelectedUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export function mapUserToResponse(user: RawSelectedUser): {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
} {
  const { emailVerified, phoneVerified, ...rest } = user;
  return { ...rest, isEmailVerified: emailVerified, isPhoneVerified: phoneVerified };
}

export const authRepo = {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  },

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const baseSlug = `${data.firstName}${data.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    let username = baseSlug;
    let attempt = 0;
    while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
      attempt++;
      username = `${baseSlug}${Math.floor(Math.random() * 9000) + 1000}`;
    }

    return prisma.user.create({
      data: { ...data, username },
      select: USER_SELECT,
    });
  },

  async createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  },

  async deleteUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },

  async deleteExpiredRefreshTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },

  async setPasswordResetToken(
    userId: string,
    hashedToken: string,
    expiry: Date,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: expiry,
      },
    });
  },

  async findUserByResetToken(hashedToken: string) {
    return prisma.user.findFirst({
      where: { passwordResetToken: hashedToken },
    });
  },

  async clearPasswordResetToken(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });
  },

  async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },

  async backfillUsername(userId: string, firstName: string, lastName: string): Promise<string> {
    const baseSlug = `${firstName}${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    let username = baseSlug;
    while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
      username = `${baseSlug}${Math.floor(Math.random() * 9000) + 1000}`;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });
    return username;
  },

  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },

  async setPhoneVerified(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, otpRequestId: null },
      select: USER_SELECT,
    });
  },

  async setOtpRequestId(userId: string, otpRequestId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { otpRequestId },
    });
  },
};
