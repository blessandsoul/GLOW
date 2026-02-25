import { subscriptionsRepo } from './subscriptions.repo.js';
import {
  PLAN_CONFIGS,
  SUBSCRIPTION_PERIOD_DAYS,
  getPlanConfig,
} from './subscriptions.constants.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '@/shared/errors/errors.js';
import { prisma } from '@/libs/prisma.js';
import { logger } from '@/libs/logger.js';
import type {
  SubscriptionPlan,
  SubscriptionQuality,
  SubscriptionResponse,
} from './subscriptions.types.js';

function toResponse(sub: {
  id: string;
  plan: string;
  quality: string;
  status: string;
  autoRenew: boolean;
  cancelledAt: Date | null;
  currentPeriodEnd: Date;
  createdAt: Date;
}): SubscriptionResponse {
  const config = getPlanConfig(sub.plan);
  return {
    id: sub.id,
    plan: sub.plan as SubscriptionPlan,
    quality: sub.quality as SubscriptionQuality,
    status: sub.status as SubscriptionResponse['status'],
    autoRenew: sub.autoRenew,
    cancelledAt: sub.cancelledAt?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    monthlyCredits: config.monthlyCredits,
    features: {
      maxPortfolioItems: config.maxPortfolioItems,
      brandingEnabled: config.brandingEnabled,
      captionsEnabled: config.captionsEnabled,
      batchUploadEnabled: config.batchUploadEnabled,
      maxBatchSize: config.maxBatchSize,
      watermarkFree: config.watermarkFree,
    },
    createdAt: sub.createdAt.toISOString(),
  };
}

function makePeriodEnd(): Date {
  return new Date(
    Date.now() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );
}

export const subscriptionsService = {
  getPlans() {
    return Object.values(PLAN_CONFIGS).map((config) => ({
      id: config.id,
      monthlyCredits: config.monthlyCredits,
      maxPortfolioItems: config.maxPortfolioItems,
      brandingEnabled: config.brandingEnabled,
      captionsEnabled: config.captionsEnabled,
      batchUploadEnabled: config.batchUploadEnabled,
      maxBatchSize: config.maxBatchSize,
      watermarkFree: config.watermarkFree,
      prices: config.prices,
    }));
  },

  async getCurrent(userId: string): Promise<SubscriptionResponse | null> {
    const sub = await subscriptionsRepo.findByUserId(userId);
    if (!sub) return null;
    return toResponse(sub);
  },

  async subscribe(
    userId: string,
    plan: SubscriptionPlan,
    quality: SubscriptionQuality,
  ): Promise<SubscriptionResponse> {
    const existing = await subscriptionsRepo.findByUserId(userId);

    if (
      existing &&
      existing.status === 'ACTIVE' &&
      existing.plan !== 'FREE'
    ) {
      throw new ConflictError(
        'You already have an active paid subscription. Cancel first or wait for it to expire.',
        'SUBSCRIPTION_ALREADY_ACTIVE',
      );
    }

    const config = PLAN_CONFIGS[plan];
    const periodEnd = makePeriodEnd();

    const sub = await prisma.$transaction(async (tx) => {
      let subscription;

      if (existing) {
        subscription = await tx.subscription.update({
          where: { userId },
          data: {
            plan,
            quality,
            status: 'ACTIVE',
            autoRenew: true,
            cancelledAt: null,
            currentPeriodEnd: periodEnd,
          },
        });
      } else {
        subscription = await tx.subscription.create({
          data: {
            userId,
            plan,
            quality,
            status: 'ACTIVE',
            autoRenew: true,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      // Allocate monthly credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: config.monthlyCredits } },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          delta: config.monthlyCredits,
          reason: 'SUBSCRIPTION',
        },
      });

      return subscription;
    });

    return toResponse(sub);
  },

  async cancel(userId: string): Promise<SubscriptionResponse> {
    const sub = await subscriptionsRepo.findByUserId(userId);
    if (!sub) {
      throw new NotFoundError(
        'No subscription found',
        'SUBSCRIPTION_NOT_FOUND',
      );
    }
    if (sub.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Subscription is not active',
        'SUBSCRIPTION_NOT_ACTIVE',
      );
    }
    if (sub.plan === 'FREE') {
      throw new BadRequestError(
        'Cannot cancel free plan',
        'CANNOT_CANCEL_FREE',
      );
    }

    const updated = await subscriptionsRepo.update(userId, {
      autoRenew: false,
      cancelledAt: new Date(),
    });

    return toResponse(updated);
  },

  async reactivate(userId: string): Promise<SubscriptionResponse> {
    const sub = await subscriptionsRepo.findByUserId(userId);
    if (!sub) {
      throw new NotFoundError(
        'No subscription found',
        'SUBSCRIPTION_NOT_FOUND',
      );
    }
    if (sub.autoRenew) {
      throw new BadRequestError(
        'Subscription auto-renewal is already active',
        'ALREADY_ACTIVE',
      );
    }
    if (sub.status === 'EXPIRED') {
      throw new BadRequestError(
        'Subscription has expired. Please subscribe again.',
        'SUBSCRIPTION_EXPIRED',
      );
    }

    const updated = await subscriptionsRepo.update(userId, {
      autoRenew: true,
      cancelledAt: null,
    });

    return toResponse(updated);
  },

  async processRenewals(): Promise<{ renewed: number; expired: number }> {
    const now = new Date();

    // 1. Renew active subscriptions with autoRenew=true past their period
    const dueForRenewal = await subscriptionsRepo.findDueForRenewal(now);
    let renewed = 0;

    for (const sub of dueForRenewal) {
      try {
        const config = getPlanConfig(sub.plan);
        const newPeriodEnd = new Date(
          now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
        );

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { currentPeriodEnd: newPeriodEnd },
          });

          await tx.user.update({
            where: { id: sub.userId },
            data: { credits: { increment: config.monthlyCredits } },
          });

          await tx.creditTransaction.create({
            data: {
              userId: sub.userId,
              delta: config.monthlyCredits,
              reason: 'SUBSCRIPTION_RENEWAL',
            },
          });
        });

        renewed++;
      } catch (err) {
        logger.error(
          { err, subscriptionId: sub.id },
          'Failed to renew subscription',
        );
      }
    }

    // 2. Expire cancelled subscriptions past their period end
    const expiredSubs = await subscriptionsRepo.findExpired(now);
    let expiredCount = 0;

    for (const sub of expiredSubs) {
      try {
        await subscriptionsRepo.update(sub.userId, { status: 'EXPIRED' });
        expiredCount++;
      } catch (err) {
        logger.error(
          { err, subscriptionId: sub.id },
          'Failed to expire subscription',
        );
      }
    }

    return { renewed, expired: expiredCount };
  },
};
