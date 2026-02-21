import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';
import type { ReferralStats } from '../types/referrals.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

class ReferralsService {
  async getMyStats(): Promise<ReferralStats> {
    const { data } = await apiClient.get<ApiResponse<ReferralStats>>(
      API_ENDPOINTS.REFERRALS.STATS,
    );
    return data.data;
  }
}

export const referralsService = new ReferralsService();
