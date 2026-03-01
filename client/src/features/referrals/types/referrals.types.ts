export interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
  bonusDailyGenerations: number;
  currentDailyLimit: number;
  recentReferrals: Array<{
    name: string;
    joinedAt: string;
    rewarded: boolean;
  }>;
}
