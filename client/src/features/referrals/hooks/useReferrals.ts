import { useQuery } from '@tanstack/react-query';
import { referralsService } from '../services/referrals.service';
import type { ReferralStats } from '../types/referrals.types';

export const referralKeys = {
  all: ['referrals'] as const,
  stats: () => [...referralKeys.all, 'stats'] as const,
};

export function useReferralStats(): ReturnType<typeof useQuery<ReferralStats>> {
  return useQuery<ReferralStats>({
    queryKey: referralKeys.stats(),
    queryFn: () => referralsService.getMyStats(),
  });
}
