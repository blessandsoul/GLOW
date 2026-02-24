import { prisma } from '@/libs/prisma.js';
import type { CreatePortfolioItemInput, UpdatePortfolioItemInput } from './portfolio.schemas.js';

const PORTFOLIO_ITEM_SELECT = {
  id: true,
  userId: true,
  jobId: true,
  imageUrl: true,
  title: true,
  niche: true,
  isPublished: true,
  sortOrder: true,
  createdAt: true,
} as const;

export const portfolioRepo = {
  async findByUserId(userId: string) {
    return prisma.portfolioItem.findMany({
      where: { userId },
      select: PORTFOLIO_ITEM_SELECT,
      orderBy: { sortOrder: 'asc' },
    });
  },

  async countByUserId(userId: string): Promise<number> {
    return prisma.portfolioItem.count({ where: { userId } });
  },

  async findById(id: string) {
    return prisma.portfolioItem.findUnique({
      where: { id },
      select: PORTFOLIO_ITEM_SELECT,
    });
  },

  async getMaxSortOrder(userId: string): Promise<number> {
    const result = await prisma.portfolioItem.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    return result._max.sortOrder ?? -1;
  },

  async create(userId: string, data: CreatePortfolioItemInput, sortOrder: number) {
    return prisma.portfolioItem.create({
      data: {
        userId,
        imageUrl: data.imageUrl,
        title: data.title,
        niche: data.niche,
        isPublished: data.isPublished,
        jobId: data.jobId,
        sortOrder,
      },
      select: PORTFOLIO_ITEM_SELECT,
    });
  },

  async update(id: string, data: UpdatePortfolioItemInput) {
    return prisma.portfolioItem.update({
      where: { id },
      data,
      select: PORTFOLIO_ITEM_SELECT,
    });
  },

  async delete(id: string) {
    return prisma.portfolioItem.delete({
      where: { id },
    });
  },

  async batchUpdateSortOrder(items: { id: string; sortOrder: number }[]) {
    return prisma.$transaction(
      items.map((item) =>
        prisma.portfolioItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  },

  async findPublishedByUserId(userId: string) {
    return prisma.portfolioItem.findMany({
      where: { userId, isPublished: true },
      select: PORTFOLIO_ITEM_SELECT,
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });
  },

  async findMasterProfileByUserId(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: {
        bio: true,
        city: true,
        niche: true,
        instagram: true,
        services: true,
      },
    });
  },

  async findBrandingByUserId(userId: string) {
    return prisma.brandingProfile.findUnique({
      where: { userId },
      select: {
        displayName: true,
        primaryColor: true,
        logoUrl: true,
      },
    });
  },

  async getReviewStats(userId: string): Promise<{ count: number; average: number }> {
    const result = await prisma.review.aggregate({
      where: { masterId: userId },
      _count: true,
      _avg: { rating: true },
    });
    return {
      count: result._count,
      average: result._avg.rating ?? 0,
    };
  },

  async findReviewsByUserId(userId: string) {
    return prisma.review.findMany({
      where: { masterId: userId },
      select: {
        id: true,
        rating: true,
        text: true,
        clientName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },
};
