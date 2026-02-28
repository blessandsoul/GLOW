import { prisma } from '../../libs/prisma.js';

export const REFERRAL_REWARDS = {
  REFERRER_CREDITS: 3,
  REFERRED_CREDITS: 1,
} as const;

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

  async grantRewardsAndMarkRewarded(
    referralId: string,
    referrerId: string,
    referredId: string,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: referrerId },
        data: {
          credits: { increment: REFERRAL_REWARDS.REFERRER_CREDITS },
          referralBonus: { increment: REFERRAL_REWARDS.REFERRER_CREDITS },
        },
      }),
      prisma.user.update({
        where: { id: referredId },
        data: {
          credits: { increment: REFERRAL_REWARDS.REFERRED_CREDITS },
          referralBonus: { increment: REFERRAL_REWARDS.REFERRED_CREDITS },
        },
      }),
      prisma.creditTransaction.create({
        data: { userId: referrerId, delta: REFERRAL_REWARDS.REFERRER_CREDITS, reason: 'REFERRAL_REWARD' },
      }),
      prisma.creditTransaction.create({
        data: { userId: referredId, delta: REFERRAL_REWARDS.REFERRED_CREDITS, reason: 'REFERRAL_BONUS' },
      }),
      prisma.referral.update({
        where: { id: referralId },
        data: { rewardGiven: true },
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
