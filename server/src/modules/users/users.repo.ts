import { prisma } from '@/libs/prisma.js';
import { USER_SELECT } from '@/modules/auth/auth.repo.js';

export const usersRepo = {
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  },

  async updateUser(id: string, data: { firstName?: string; lastName?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
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
