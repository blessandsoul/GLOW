import { prisma } from '@/libs/prisma.js';

const SUBSCRIPTION_SELECT = {
  id: true,
  userId: true,
  plan: true,
  quality: true,
  status: true,
  autoRenew: true,
  cancelledAt: true,
  currentPeriodEnd: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const subscriptionsRepo = {
  async findByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      select: SUBSCRIPTION_SELECT,
    });
  },

  async create(data: {
    userId: string;
    plan: string;
    quality: string;
    status: string;
    autoRenew: boolean;
    currentPeriodEnd: Date;
  }) {
    return prisma.subscription.create({
      data,
      select: SUBSCRIPTION_SELECT,
    });
  },

  async update(
    userId: string,
    data: {
      plan?: string;
      quality?: string;
      status?: string;
      autoRenew?: boolean;
      cancelledAt?: Date | null;
      currentPeriodEnd?: Date;
    },
  ) {
    return prisma.subscription.update({
      where: { userId },
      data,
      select: SUBSCRIPTION_SELECT,
    });
  },

  async findDueForRenewal(now: Date) {
    return prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        autoRenew: true,
        currentPeriodEnd: { lte: now },
      },
      select: SUBSCRIPTION_SELECT,
    });
  },

  async findExpired(now: Date) {
    return prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        autoRenew: false,
        currentPeriodEnd: { lte: now },
      },
      select: SUBSCRIPTION_SELECT,
    });
  },
};
