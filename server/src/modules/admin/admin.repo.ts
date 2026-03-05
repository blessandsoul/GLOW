import { prisma } from '@/libs/prisma.js';
import { Prisma } from '@prisma/client';

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
        where: { userId, status: 'DONE', results: { not: Prisma.DbNull } },
        select: {
          id: true,
          originalUrl: true,
          results: true,
          createdAt: true,
          captions: { select: { variant: true, language: true, text: true, hashtags: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({
        where: { userId, status: 'DONE', results: { not: Prisma.DbNull } },
      }),
    ]);

    const images: {
      jobId: string;
      originalUrl: string | null;
      imageUrl: string;
      variantIndex: number;
      createdAt: Date;
      captions: { language: string; text: string; hashtags: string }[];
    }[] = [];
    for (const job of jobs) {
      const results = job.results as string[] | null;
      if (!results) continue;
      // All captions for this job (shared across variants)
      const jobCaptions = job.captions.map(({ language, text, hashtags }) => ({ language, text, hashtags }));
      for (let i = 0; i < results.length; i++) {
        images.push({
          jobId: job.id,
          originalUrl: job.originalUrl,
          imageUrl: results[i],
          variantIndex: i,
          createdAt: job.createdAt,
          captions: i === 0 ? jobCaptions : [],
        });
      }
    }
    return { images, totalJobs };
  },

  async findUsersWithPortfolios(page: number, limit: number, search?: string) {
    const searchFilter = buildSearchFilter(search);
    const where = { deletedAt: null, portfolioItems: { some: {} }, ...searchFilter };

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        masterProfile: { select: { niche: true } },
        _count: { select: { portfolioItems: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  async countUsersWithPortfolios(search?: string): Promise<number> {
    const searchFilter = buildSearchFilter(search);
    return prisma.user.count({
      where: { deletedAt: null, portfolioItems: { some: {} }, ...searchFilter },
    });
  },

  async countPublishedByUserIds(userIds: string[]): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    const counts = await prisma.portfolioItem.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, isPublished: true },
      _count: true,
    });

    const result: Record<string, number> = {};
    for (const row of counts) {
      result[row.userId] = row._count;
    }
    return result;
  },

  async getLatestItemDateByUserIds(userIds: string[]): Promise<Record<string, Date>> {
    if (userIds.length === 0) return {};

    const results = await prisma.portfolioItem.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _max: { createdAt: true },
    });

    const map: Record<string, Date> = {};
    for (const row of results) {
      if (row._max.createdAt) {
        map[row.userId] = row._max.createdAt;
      }
    }
    return map;
  },

  async findPortfolioItems(userId: string, page: number, limit: number) {
    const where = { userId };

    const [items, totalItems] = await Promise.all([
      prisma.portfolioItem.findMany({
        where,
        select: {
          id: true,
          imageUrl: true,
          title: true,
          niche: true,
          isPublished: true,
          sortOrder: true,
          createdAt: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.portfolioItem.count({ where }),
    ]);

    return { items, totalItems };
  },
};
