import { prisma } from '../../libs/prisma.js';
import { BadRequestError } from '../../shared/errors/errors.js';

export const creditsRepo = {
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user?.credits ?? 0;
  },

  async getTransactions(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Array<{
    id: string;
    delta: number;
    reason: string;
    jobId: string | null;
    createdAt: Date;
  }>; totalItems: number }> {
    const offset = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.creditTransaction.count({ where: { userId } }),
    ]);

    return { items, totalItems };
  },

  async getActivePackages(): Promise<Array<{
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
  }>> {
    return prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async getPackageById(id: string): Promise<{
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
  } | null> {
    return prisma.creditPackage.findUnique({ where: { id } });
  },

  async purchasePackage(
    userId: string,
    packageId: string,
    credits: number,
    amount: number,
    currency: string,
  ): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.creditPurchase.create({
        data: {
          userId,
          packageId,
          credits,
          amount,
          currency,
          status: 'COMPLETED',
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
        select: { credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          delta: credits,
          reason: 'PACKAGE_PURCHASE',
        },
      });

      return updatedUser.credits;
    });

    return result;
  },

  async deductCredits(
    userId: string,
    amount: number,
    reason: string,
    jobId?: string,
  ): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user || user.credits < amount) {
        throw new BadRequestError(
          'Insufficient credits',
          'INSUFFICIENT_CREDITS',
        );
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount } },
        select: { credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          delta: -amount,
          reason,
          jobId,
        },
      });

      return updatedUser.credits;
    });

    return result;
  },

  async getTransactionSummary(userId: string): Promise<{
    totalEarned: number;
    totalSpent: number;
  }> {
    const [earned, spent] = await Promise.all([
      prisma.creditTransaction.aggregate({
        where: { userId, delta: { gt: 0 } },
        _sum: { delta: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { userId, delta: { lt: 0 } },
        _sum: { delta: true },
      }),
    ]);

    return {
      totalEarned: earned._sum.delta ?? 0,
      totalSpent: Math.abs(spent._sum.delta ?? 0),
    };
  },
};
