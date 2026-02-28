import { prisma } from '../../libs/prisma.js';

export const referralsRepo = {
  async findByCode(code: string) {
    return prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, referralCode: true },
    });
  },

  async createReferral(referrerId: string, referredId: string, referredPhone: string) {
    return prisma.referral.create({
      data: { referrerId, referredId, referredPhone, rewardGiven: false },
    });
  },

  async findReferralByPhone(phone: string) {
    return prisma.referral.findFirst({
      where: { referredPhone: phone },
      select: { id: true },
    });
  },

  async findPendingReferralByReferredId(referredId: string) {
    return prisma.referral.findFirst({
      where: { referredId, rewardGiven: false },
      select: { id: true, referrerId: true, referredId: true },
    });
  },

  async markRewarded(referralId: string) {
    return prisma.referral.update({
      where: { id: referralId },
      data: { rewardGiven: true },
    });
  },

  async grantRewards(referrerId: string, referredId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: referrerId },
        data: { credits: { increment: 3 }, referralBonus: { increment: 3 } },
      }),
      prisma.user.update({
        where: { id: referredId },
        data: { credits: { increment: 1 }, referralBonus: { increment: 1 } },
      }),
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
        referred: { select: { firstName: true, createdAt: true, phoneVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },

  async findUserCode(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, referralBonus: true },
    });
  },
};
