import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { TrendTemplate } from '../types/trend.types';

class TrendService {
    async getCurrentTrends(): Promise<TrendTemplate[]> {
        const { data } = await apiClient.get<ApiResponse<TrendTemplate[]>>(
            API_ENDPOINTS.TRENDS.CURRENT,
        );
        return data.data;
    }

    async getArchive(): Promise<TrendTemplate[]> {
        const { data } = await apiClient.get<ApiResponse<TrendTemplate[]>>(
            API_ENDPOINTS.TRENDS.ARCHIVE,
        );
        return data.data;
    }
}

export const trendService = new TrendService();
