import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import type { FeaturedMaster, CatalogFilters, CatalogDistrict, CatalogBrand, CatalogStyleTag } from '../types/masters.types';

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

    async getNicheCounts(): Promise<{ niche: string; count: number }[]> {
        const { data } = await apiClient.get<ApiResponse<{ niche: string; count: number }[]>>(
            API_ENDPOINTS.MASTERS.NICHE_COUNTS,
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

    async getDistricts(citySlug?: string): Promise<CatalogDistrict[]> {
        const { data } = await apiClient.get<ApiResponse<CatalogDistrict[]>>(
            API_ENDPOINTS.CATALOG.DISTRICTS,
            { params: citySlug ? { citySlug } : {} },
        );
        return data.data;
    }

    async getBrands(): Promise<CatalogBrand[]> {
        const { data } = await apiClient.get<ApiResponse<CatalogBrand[]>>(
            API_ENDPOINTS.CATALOG.BRANDS,
        );
        return data.data;
    }

    async getStyleTags(niche?: string): Promise<CatalogStyleTag[]> {
        const { data } = await apiClient.get<ApiResponse<CatalogStyleTag[]>>(
            API_ENDPOINTS.CATALOG.STYLE_TAGS,
            { params: niche ? { niche } : {} },
        );
        return data.data;
    }
}

export const mastersService = new MastersService();
