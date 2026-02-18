import { prisma } from '../../libs/prisma.js';

export const referralsRepo = {
  async findByCode(code: string) {
    return prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, referralCode: true },
    });
  },

  async createReferral(referrerId: string, referredId: string) {
    return prisma.referral.create({
      data: { referrerId, referredId, rewardGiven: true },
    });
  },

  async grantRewards(referrerId: string, referredId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({ where: { id: referrerId }, data: { credits: { increment: 3 } } }),
      prisma.user.update({ where: { id: referredId }, data: { credits: { increment: 1 } } }),
      prisma.creditTransaction.create({
        data: { userId: referrerId, delta: 3, reason: 'REFERRAL_REWARD' },
      }),
      prisma.creditTransaction.create({
        data: { userId: referredId, delta: 1, reason: 'REFERRAL_BONUS' },
      }),
    ]);
  },

  async getStats(userId: string) {
    return prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: { select: { firstName: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },

  async findUserCode(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
  },
};
