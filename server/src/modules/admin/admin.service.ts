import { adminRepo } from './admin.repo.js';
import { isLaunchMode, getDailyUsage } from '../../libs/launch-mode.js';
import { redis } from '../../libs/redis.js';
import { logger } from '../../libs/logger.js';
import type { AdminUsersQuery, AdminPortfoliosQuery } from './admin.schemas.js';

export function createAdminService() {
  return {
    async getUsers(query: AdminUsersQuery) {
      const { page, limit, search } = query;

      const [users, totalItems] = await Promise.all([
        adminRepo.findUsersWithCounts(page, limit, search),
        adminRepo.countUsers(search),
      ]);

      const userIds = users.map((u) => u.id);
      const [captionCounts, hdUpscaleCounts] = await Promise.all([
        adminRepo.countCaptionsByUserIds(userIds),
        adminRepo.countHdUpscalesByUserIds(userIds),
      ]);

      // In launch mode, fetch daily usage for all users on this page
      let dailyUsageMap: Record<string, { used: number; limit: number }> = {};
      if (isLaunchMode() && userIds.length > 0) {
        const usageEntries = await Promise.all(
          userIds.map(async (id) => {
            const usage = await getDailyUsage(id);
            return [id, { used: usage.used, limit: usage.limit }] as const;
          }),
        );
        dailyUsageMap = Object.fromEntries(usageEntries);
      }

      const items = users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.emailVerified,
        credits: user.credits,
        plan: user.subscription?.plan ?? 'FREE',
        jobCount: user._count.jobs,
        captionCount: captionCounts[user.id] ?? 0,
        hdUpscaleCount: hdUpscaleCounts[user.id] ?? 0,
        createdAt: user.createdAt,
        dailyUsage: dailyUsageMap[user.id] ?? null,
      }));

      return { items, totalItems };
    },

    async getStats() {
      return adminRepo.getStats();
    },

    async getUserImages(userId: string, page: number, limit: number) {
      return adminRepo.findUserImages(userId, page, limit);
    },

    async flushDailyLimits(userId: string): Promise<{ deleted: boolean }> {
      const key = `launch_daily:${userId}`;
      const deleted = await redis.del(key);
      logger.info({ userId, deleted }, 'Admin flushed own daily generation limit');
      return { deleted: deleted > 0 };
    },

    async getPortfolioUsers(query: AdminPortfoliosQuery) {
      const { page, limit, search } = query;

      const [users, totalItems] = await Promise.all([
        adminRepo.findUsersWithPortfolios(page, limit, search),
        adminRepo.countUsersWithPortfolios(search),
      ]);

      const userIds = users.map((u) => u.id);
      const [publishedCounts, latestDates] = await Promise.all([
        adminRepo.countPublishedByUserIds(userIds),
        adminRepo.getLatestItemDateByUserIds(userIds),
      ]);

      const items = users.map((user) => ({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        niche: user.masterProfile?.niche ?? null,
        totalItems: user._count.portfolioItems,
        publishedItems: publishedCounts[user.id] ?? 0,
        latestItemDate: latestDates[user.id] ?? null,
      }));

      return { items, totalItems };
    },

    async getPortfolioItems(userId: string, page: number, limit: number) {
      return adminRepo.findPortfolioItems(userId, page, limit);
    },
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
