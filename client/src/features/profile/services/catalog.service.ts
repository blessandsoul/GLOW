import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { ServiceCategory, SpecialityOption } from '../types/profile.types';

class CatalogService {
    async getSpecialities(): Promise<SpecialityOption[]> {
        const { data } = await apiClient.get<ApiResponse<SpecialityOption[]>>(
            API_ENDPOINTS.CATALOG.SPECIALITIES,
        );
        return data.data;
    }

    async getServiceCategories(): Promise<ServiceCategory[]> {
        const { data } = await apiClient.get<ApiResponse<ServiceCategory[]>>(
            API_ENDPOINTS.CATALOG.SERVICE_CATEGORIES,
        );
        return data.data;
    }
}

export const catalogService = new CatalogService();
