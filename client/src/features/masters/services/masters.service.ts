import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import type { FeaturedMaster, CatalogFilters } from '../types/masters.types';

class MastersService {
    async getFeatured(limit: number = 12, niche?: string): Promise<FeaturedMaster[]> {
        const params: Record<string, unknown> = { limit };
        if (niche) params.niche = niche;

        const { data } = await apiClient.get<ApiResponse<FeaturedMaster[]>>(
            API_ENDPOINTS.MASTERS.FEATURED,
            { params },
        );
        return data.data;
    }

    async getCatalog(filters: CatalogFilters): Promise<PaginatedApiResponse<FeaturedMaster>['data']> {
        const { data } = await apiClient.get<PaginatedApiResponse<FeaturedMaster>>(
            API_ENDPOINTS.MASTERS.CATALOG,
            { params: filters },
        );
        return data.data;
    }
}

export const mastersService = new MastersService();
