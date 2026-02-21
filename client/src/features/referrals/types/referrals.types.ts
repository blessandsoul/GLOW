export interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
  recentReferrals: Array<{
    name: string;
    joinedAt: string;
    rewarded: boolean;
  }>;
}
