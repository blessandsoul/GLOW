import { prisma } from '@/libs/prisma.js';
import { USER_SELECT } from '@/modules/auth/auth.repo.js';

const USERNAME_COOLDOWN_DAYS = 30;

export const usersRepo = {
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  },

  async updateUser(id: string, data: { firstName?: string; lastName?: string; username?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  },

  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });
  },

  async isUsernameFrozen(username: string): Promise<boolean> {
    const record = await prisma.usernameHistory.findFirst({
      where: {
        username,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    return !!record;
  },

  async getLastUsernameChange(userId: string) {
    return prisma.usernameHistory.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, expiresAt: true },
    });
  },

  async saveUsernameHistory(userId: string, oldUsername: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + USERNAME_COOLDOWN_DAYS);

    await prisma.usernameHistory.create({
      data: {
        userId,
        username: oldUsername,
        expiresAt,
      },
    });
  },

  async findFrozenUsername(username: string) {
    return prisma.usernameHistory.findFirst({
      where: {
        username,
        expiresAt: { gt: new Date() },
      },
      select: {
        user: {
          select: { username: true },
        },
      },
    });
  },

  async updateAvatar(id: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
      select: USER_SELECT,
    });
  },

  async softDeleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },

  async deleteUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },
};
