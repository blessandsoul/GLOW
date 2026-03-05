import { prisma } from '@/libs/prisma.js';
import type { Prisma } from '@prisma/client';

function buildSearchFilter(search?: string): Prisma.UserWhereInput {
  if (!search) return {};
  return {
    OR: [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ],
  };
}

export const adminRepo = {
  async findUsersWithCounts(
    page: number,
    limit: number,
    search?: string,
  ) {
    const searchFilter = buildSearchFilter(search);

    return prisma.user.findMany({
      where: { deletedAt: null, ...searchFilter },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        credits: true,
        createdAt: true,
        subscription: { select: { plan: true } },
        _count: { select: { jobs: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  async countUsers(search?: string): Promise<number> {
    const searchFilter = buildSearchFilter(search);

    return prisma.user.count({
      where: { deletedAt: null, ...searchFilter },
    });
  },

  async countCaptionsByUserIds(userIds: string[]): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    const counts = await prisma.caption.groupBy({
      by: ['jobId'],
      where: {
        job: { userId: { in: userIds } },
      },
      _count: true,
    });

    // We need to map jobId → userId, then aggregate per user
    const jobIds = counts.map((c) => c.jobId);
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, userId: true },
    });

    const jobToUser = new Map(jobs.map((j) => [j.id, j.userId]));
    const result: Record<string, number> = {};

    for (const row of counts) {
      const userId = jobToUser.get(row.jobId);
      if (userId) {
        result[userId] = (result[userId] ?? 0) + row._count;
      }
    }

    return result;
  },

  async countHdUpscalesByUserIds(userIds: string[]): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    const counts = await prisma.hdUpscaleLog.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: true,
    });

    const result: Record<string, number> = {};
    for (const row of counts) {
      result[row.userId] = row._count;
    }
    return result;
  },

  async getStats() {
    const [totalUsers, totalJobs, totalCaptions, totalHdUpscales, subscriptions] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.job.count(),
        prisma.caption.count(),
        prisma.hdUpscaleLog.count(),
        prisma.subscription.groupBy({
          by: ['plan'],
          where: { status: 'ACTIVE' },
          _count: true,
        }),
      ]);

    const activeSubscriptions: Record<string, number> = {};
    for (const sub of subscriptions) {
      activeSubscriptions[sub.plan] = sub._count;
    }

    return { totalUsers, totalJobs, totalCaptions, totalHdUpscales, activeSubscriptions };
  },

  async findUserImages(userId: string, page: number, limit: number) {
    const [jobs, totalJobs] = await Promise.all([
      prisma.job.findMany({
        where: { userId, status: 'DONE', results: { not: null } },
        select: { id: true, results: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({
        where: { userId, status: 'DONE', results: { not: null } },
      }),
    ]);

    const images: { jobId: string; imageUrl: string; variantIndex: number; createdAt: Date }[] = [];
    for (const job of jobs) {
      const results = job.results as string[] | null;
      if (!results) continue;
      for (let i = 0; i < results.length; i++) {
        images.push({ jobId: job.id, imageUrl: results[i], variantIndex: i, createdAt: job.createdAt });
      }
    }
    return { images, totalJobs };
  },
};
