import { prisma } from '@/libs/prisma.js';
import { favoritesRepo } from './favorites.repo.js';
import { NotFoundError, ConflictError } from '@/shared/errors/errors.js';

export const favoritesService = {
  async addMaster(userId: string, masterProfileId: string) {
    const masterProfile = await prisma.masterProfile.findUnique({
      where: { id: masterProfileId },
      select: { id: true },
    });
    if (!masterProfile) {
      throw new NotFoundError('Master profile not found', 'MASTER_NOT_FOUND');
    }

    const existing = await favoritesRepo.findMasterFavorite(userId, masterProfileId);
    if (existing) {
      throw new ConflictError('Master is already in your favorites', 'ALREADY_FAVORITED');
    }

    return favoritesRepo.addMaster(userId, masterProfileId);
  },

  async removeMaster(userId: string, masterProfileId: string) {
    const existing = await favoritesRepo.findMasterFavorite(userId, masterProfileId);
    if (!existing) {
      throw new NotFoundError('Favorite not found', 'FAVORITE_NOT_FOUND');
    }

    await favoritesRepo.removeMaster(userId, masterProfileId);
  },

  async listFavoriteMasters(userId: string, page: number, limit: number) {
    return favoritesRepo.listFavoriteMasters(userId, page, limit);
  },

  async addPortfolioItem(userId: string, portfolioItemId: string) {
    const portfolioItem = await prisma.portfolioItem.findUnique({
      where: { id: portfolioItemId },
      select: { id: true },
    });
    if (!portfolioItem) {
      throw new NotFoundError('Portfolio item not found', 'PORTFOLIO_ITEM_NOT_FOUND');
    }

    const existing = await favoritesRepo.findPortfolioFavorite(userId, portfolioItemId);
    if (existing) {
      throw new ConflictError('Portfolio item is already in your favorites', 'ALREADY_FAVORITED');
    }

    return favoritesRepo.addPortfolioItem(userId, portfolioItemId);
  },

  async removePortfolioItem(userId: string, portfolioItemId: string) {
    const existing = await favoritesRepo.findPortfolioFavorite(userId, portfolioItemId);
    if (!existing) {
      throw new NotFoundError('Favorite not found', 'FAVORITE_NOT_FOUND');
    }

    await favoritesRepo.removePortfolioItem(userId, portfolioItemId);
  },

  async listFavoritePortfolioItems(userId: string, page: number, limit: number) {
    return favoritesRepo.listFavoritePortfolioItems(userId, page, limit);
  },

  async getStatus(
    userId: string,
    masterIds: string[],
    portfolioItemIds: string[],
  ): Promise<{ masters: Record<string, boolean>; portfolioItems: Record<string, boolean> }> {
    const [masters, portfolioItems] = await Promise.all([
      masterIds.length > 0 ? favoritesRepo.checkMasterStatus(userId, masterIds) : Promise.resolve({}),
      portfolioItemIds.length > 0
        ? favoritesRepo.checkPortfolioStatus(userId, portfolioItemIds)
        : Promise.resolve({}),
    ]);

    return { masters, portfolioItems };
  },
};
