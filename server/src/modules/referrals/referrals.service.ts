import { referralsRepo } from './referrals.repo.js';
import { logger } from '../../libs/logger.js';

interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
  recentReferrals: Array<{
    name: string;
    joinedAt: Date;
    rewarded: boolean;
  }>;
}

export const referralsService = {
  generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  },

  async applyReferralOnRegister(
    newUserId: string,
    referralCode: string | undefined,
  ): Promise<void> {
    if (!referralCode) return;
    try {
      const referrer = await referralsRepo.findByCode(referralCode);
      if (!referrer || referrer.id === newUserId) return;
      await referralsRepo.createReferral(referrer.id, newUserId);
      await referralsRepo.grantRewards(referrer.id, newUserId);
    } catch (err) {
      // Non-fatal: referral errors should never break registration
      logger.warn({ err, newUserId, referralCode }, 'Failed to apply referral');
    }
  },

  async getMyStats(userId: string, appUrl: string): Promise<ReferralStats> {
    const user = await referralsRepo.findUserCode(userId);
    const referrals = await referralsRepo.getStats(userId);

    const referralCode = user?.referralCode ?? null;
    const referralLink = referralCode ? `${appUrl}/r/${referralCode}` : null;
    const totalCreditsEarned = referrals.filter((r) => r.rewardGiven).length * 3;

    return {
      referralCode,
      referralLink,
      totalReferrals: referrals.length,
      totalCreditsEarned,
      recentReferrals: referrals.map((r) => ({
        name: r.referred.firstName,
        joinedAt: r.referred.createdAt,
        rewarded: r.rewardGiven,
      })),
    };
  },
};
