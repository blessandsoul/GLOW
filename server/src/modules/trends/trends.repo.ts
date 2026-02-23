import { prisma } from '@/libs/prisma.js';

const TREND_SELECT = {
  id: true,
  title: true,
  description: true,
  previewUrl: true,
  settings: true,
  weekOf: true,
  isFree: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
} as const;

export const trendsRepo = {
  async findActive() {
    return prisma.trendTemplate.findMany({
      where: { isActive: true },
      select: TREND_SELECT,
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findArchived(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.trendTemplate.findMany({
        where: { isActive: false },
        select: TREND_SELECT,
        orderBy: { weekOf: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.trendTemplate.count({
        where: { isActive: false },
      }),
    ]);

    return { items, totalItems };
  },
};
