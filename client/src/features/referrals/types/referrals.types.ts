export interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
  bonusGenerationsRemaining: number;
  currentDailyLimit: number;
  recentReferrals: Array<{
    name: string;
    joinedAt: string;
    rewarded: boolean;
  }>;
}
