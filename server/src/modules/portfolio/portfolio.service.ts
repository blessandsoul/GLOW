import { portfolioRepo } from './portfolio.repo.js';
import { NotFoundError, ForbiddenError } from '@/shared/errors/errors.js';
import type { CreatePortfolioItemInput, UpdatePortfolioItemInput } from './portfolio.schemas.js';

export function createPortfolioService() {
  return {
    async getMyItems(userId: string) {
      return portfolioRepo.findByUserId(userId);
    },

    async createItem(userId: string, input: CreatePortfolioItemInput) {
      const maxSort = await portfolioRepo.getMaxSortOrder(userId);
      return portfolioRepo.create(userId, input, maxSort + 1);
    },

    async updateItem(userId: string, itemId: string, input: UpdatePortfolioItemInput) {
      const item = await portfolioRepo.findById(itemId);
      if (!item) {
        throw new NotFoundError('Portfolio item not found', 'PORTFOLIO_ITEM_NOT_FOUND');
      }
      if (item.userId !== userId) {
        throw new ForbiddenError('You do not own this portfolio item', 'NOT_OWNER');
      }
      return portfolioRepo.update(itemId, input);
    },

    async deleteItem(userId: string, itemId: string) {
      const item = await portfolioRepo.findById(itemId);
      if (!item) {
        throw new NotFoundError('Portfolio item not found', 'PORTFOLIO_ITEM_NOT_FOUND');
      }
      if (item.userId !== userId) {
        throw new ForbiddenError('You do not own this portfolio item', 'NOT_OWNER');
      }
      await portfolioRepo.delete(itemId);
    },

    async getPublicPortfolio(username: string) {
      const user = await portfolioRepo.findUserByUsername(username);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const [items, profile, branding, reviewStats] = await Promise.all([
        portfolioRepo.findPublishedByUserId(user.id),
        portfolioRepo.findMasterProfileByUserId(user.id),
        portfolioRepo.findBrandingByUserId(user.id),
        portfolioRepo.getReviewStats(user.id),
      ]);

      return {
        username: user.username,
        displayName: branding?.displayName ?? `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        bio: profile?.bio ?? null,
        instagram: profile?.instagram ?? null,
        city: profile?.city ?? null,
        niche: profile?.niche ?? null,
        services: profile?.services ?? [],
        primaryColor: branding?.primaryColor ?? null,
        logoUrl: branding?.logoUrl ?? null,
        items,
        reviewsCount: reviewStats.count,
        averageRating: reviewStats.average,
      };
    },
  };
}

export type PortfolioService = ReturnType<typeof createPortfolioService>;
