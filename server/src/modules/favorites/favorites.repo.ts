import { prisma } from '@/libs/prisma.js';

const FAVORITE_MASTER_SELECT = {
  id: true,
  userId: true,
  masterProfileId: true,
  createdAt: true,
  masterProfile: {
    select: {
      id: true,
      city: true,
      niche: true,
      verificationStatus: true,
      isCertified: true,
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  },
} as const;

const FAVORITE_PORTFOLIO_SELECT = {
  id: true,
  userId: true,
  portfolioItemId: true,
  createdAt: true,
  portfolioItem: {
    select: {
      id: true,
      imageUrl: true,
      title: true,
      niche: true,
      isPublished: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  },
} as const;

export const favoritesRepo = {
  async addMaster(userId: string, masterProfileId: string) {
    return prisma.favoriteMaster.create({
      data: { userId, masterProfileId },
    });
  },

  async removeMaster(userId: string, masterProfileId: string) {
    return prisma.favoriteMaster.delete({
      where: { userId_masterProfileId: { userId, masterProfileId } },
    });
  },

  async findMasterFavorite(userId: string, masterProfileId: string) {
    return prisma.favoriteMaster.findUnique({
      where: { userId_masterProfileId: { userId, masterProfileId } },
      select: { id: true },
    });
  },

  async listFavoriteMasters(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [items, totalItems] = await prisma.$transaction([
      prisma.favoriteMaster.findMany({
        where: { userId },
        select: FAVORITE_MASTER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.favoriteMaster.count({ where: { userId } }),
    ]);

    return { items, totalItems };
  },

  async addPortfolioItem(userId: string, portfolioItemId: string) {
    return prisma.favoritePortfolioItem.create({
      data: { userId, portfolioItemId },
    });
  },

  async removePortfolioItem(userId: string, portfolioItemId: string) {
    return prisma.favoritePortfolioItem.delete({
      where: { userId_portfolioItemId: { userId, portfolioItemId } },
    });
  },

  async findPortfolioFavorite(userId: string, portfolioItemId: string) {
    return prisma.favoritePortfolioItem.findUnique({
      where: { userId_portfolioItemId: { userId, portfolioItemId } },
      select: { id: true },
    });
  },

  async listFavoritePortfolioItems(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [items, totalItems] = await prisma.$transaction([
      prisma.favoritePortfolioItem.findMany({
        where: { userId },
        select: FAVORITE_PORTFOLIO_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.favoritePortfolioItem.count({ where: { userId } }),
    ]);

    return { items, totalItems };
  },

  async checkMasterStatus(userId: string, masterProfileIds: string[]): Promise<Record<string, boolean>> {
    const favorites = await prisma.favoriteMaster.findMany({
      where: { userId, masterProfileId: { in: masterProfileIds } },
      select: { masterProfileId: true },
    });

    const favorited = new Set(favorites.map((f) => f.masterProfileId));
    return Object.fromEntries(masterProfileIds.map((id) => [id, favorited.has(id)]));
  },

  async checkPortfolioStatus(userId: string, portfolioItemIds: string[]): Promise<Record<string, boolean>> {
    const favorites = await prisma.favoritePortfolioItem.findMany({
      where: { userId, portfolioItemId: { in: portfolioItemIds } },
      select: { portfolioItemId: true },
    });

    const favorited = new Set(favorites.map((f) => f.portfolioItemId));
    return Object.fromEntries(portfolioItemIds.map((id) => [id, favorited.has(id)]));
  },
};
