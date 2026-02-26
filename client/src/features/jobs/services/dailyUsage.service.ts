import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';

export interface DailyUsage {
    used: number;
    limit: number;
    resetsAt: string;
}

class DailyUsageService {
    async getDailyUsage(): Promise<DailyUsage | null> {
        const response = await apiClient.get<ApiResponse<DailyUsage | null>>('/jobs/daily-usage');
        return response.data.data;
    }
}

export const dailyUsageService = new DailyUsageService();
