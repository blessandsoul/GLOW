import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { FeaturedMaster } from '../types/masters.types';

class MastersService {
    async getFeatured(limit: number = 12): Promise<FeaturedMaster[]> {
        const { data } = await apiClient.get<ApiResponse<FeaturedMaster[]>>(
            API_ENDPOINTS.MASTERS.FEATURED,
            { params: { limit } },
        );
        return data.data;
    }
}

export const mastersService = new MastersService();
