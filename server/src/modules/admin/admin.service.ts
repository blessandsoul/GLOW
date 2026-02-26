import { adminRepo } from './admin.repo.js';
import { isLaunchMode, getDailyUsage } from '../../libs/launch-mode.js';
import type { AdminUsersQuery } from './admin.schemas.js';

export function createAdminService() {
  return {
    async getUsers(query: AdminUsersQuery) {
      const { page, limit, search } = query;

      const [users, totalItems] = await Promise.all([
        adminRepo.findUsersWithCounts(page, limit, search),
        adminRepo.countUsers(search),
      ]);

      const userIds = users.map((u) => u.id);
      const captionCounts = await adminRepo.countCaptionsByUserIds(userIds);

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
        createdAt: user.createdAt,
        dailyUsage: dailyUsageMap[user.id] ?? null,
      }));

      return { items, totalItems };
    },

    async getStats() {
      return adminRepo.getStats();
    },
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
