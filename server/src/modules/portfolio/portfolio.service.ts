import { portfolioRepo } from './portfolio.repo.js';
import { NotFoundError, ForbiddenError } from '@/shared/errors/errors.js';
import { getPlanConfig } from '@/modules/subscriptions/subscriptions.constants.js';
import { prisma } from '@/libs/prisma.js';
import type { CreatePortfolioItemInput, UpdatePortfolioItemInput, ReorderPortfolioInput } from './portfolio.schemas.js';

export function createPortfolioService() {
  return {
    async getMyItems(userId: string) {
      return portfolioRepo.findByUserId(userId);
    },

    async createItem(userId: string, input: CreatePortfolioItemInput) {
      // Check portfolio item limit based on subscription plan
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscription: { select: { plan: true } } },
      });
      const config = getPlanConfig(user?.subscription?.plan ?? 'FREE');

      if (config.maxPortfolioItems !== null) {
        const count = await portfolioRepo.countByUserId(userId);
        if (count >= config.maxPortfolioItems) {
          throw new ForbiddenError(
            `Portfolio limit reached (${config.maxPortfolioItems} items). Upgrade your plan for unlimited portfolio.`,
            'PORTFOLIO_LIMIT_REACHED',
          );
        }
      }

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

    async reorderItems(userId: string, input: ReorderPortfolioInput) {
      // Verify all items belong to the user
      const userItems = await portfolioRepo.findByUserId(userId);
      const userItemIds = new Set(userItems.map((item) => item.id));

      for (const item of input.items) {
        if (!userItemIds.has(item.id)) {
          throw new ForbiddenError('You do not own one or more portfolio items', 'NOT_OWNER');
        }
      }

      await portfolioRepo.batchUpdateSortOrder(input.items);
      return portfolioRepo.findByUserId(userId);
    },

    async getPublicPortfolio(username: string) {
      const user = await portfolioRepo.findUserByUsername(username);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const [items, profile, branding, reviewStats, reviews] = await Promise.all([
        portfolioRepo.findPublishedByUserId(user.id),
        portfolioRepo.findMasterProfileByUserId(user.id),
        portfolioRepo.findBrandingByUserId(user.id),
        portfolioRepo.getReviewStats(user.id),
        portfolioRepo.findReviewsByUserId(user.id),
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
        reviews,
        reviewsCount: reviewStats.count,
        averageRating: reviewStats.average,
      };
    },
  };
}

export type PortfolioService = ReturnType<typeof createPortfolioService>;
