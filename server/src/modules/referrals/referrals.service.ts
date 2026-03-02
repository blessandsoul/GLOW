import { referralsRepo, REFERRAL_REWARDS } from './referrals.repo.js';
import { env } from '../../config/env.js';
import { logger } from '../../libs/logger.js';

interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
  bonusDailyGenerations: number;
  currentDailyLimit: number;
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
    phone?: string,
  ): Promise<void> {
    if (!referralCode) return;
    try {
      const referrer = await referralsRepo.findByCode(referralCode);
      if (!referrer || referrer.id === newUserId) return;

      // Anti-abuse: check if this phone was already used in a referral (only if phone provided)
      if (phone) {
        const existingReferral = await referralsRepo.findReferralByPhone(phone);
        if (existingReferral) return;
      }

      await referralsRepo.createReferral(referrer.id, newUserId, phone ?? '');
    } catch (err) {
      // Non-fatal: referral errors should never break registration
      logger.warn({ err, newUserId, referralCode }, 'Failed to apply referral');
    }
  },

  async grantPendingRewards(referredUserId: string): Promise<void> {
    try {
      const pending = await referralsRepo.findPendingReferralByReferredId(referredUserId);
      if (!pending) return;

      await referralsRepo.grantRewardsAndMarkRewarded(pending.id, pending.referrerId, pending.referredId);
    } catch (err: unknown) {
      // Non-fatal: log warning but don't block the caller
      logger.warn({ err, referredUserId }, 'Failed to grant pending referral rewards');
    }
  },

  async getMyStats(userId: string, appUrl: string): Promise<ReferralStats> {
    const [user, referrals] = await Promise.all([
      referralsRepo.findUserCode(userId),
      referralsRepo.getStats(userId),
    ]);

    const referralCode = user?.referralCode ?? null;
    const referralLink = referralCode ? `${appUrl}/r/${referralCode}` : null;
    const totalCreditsEarned = referrals.filter((r) => r.rewardGiven).length * REFERRAL_REWARDS.REFERRER_CREDITS;
    const referralBonus = user?.referralBonus ?? 0;

    return {
      referralCode,
      referralLink,
      totalReferrals: referrals.length,
      totalCreditsEarned,
      bonusDailyGenerations: referralBonus,
      currentDailyLimit: env.LAUNCH_DAILY_LIMIT + referralBonus,
      recentReferrals: referrals.map((r) => ({
        name: r.referred.firstName,
        joinedAt: r.referred.createdAt,
        rewarded: r.rewardGiven,
      })),
    };
  },
};
