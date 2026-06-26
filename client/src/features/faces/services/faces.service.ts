import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import type {
    ModelCard,
    ModelDetail,
    MyModelProfile,
    OwnerPhoto,
    FacesCatalogFilters,
    ModelOnboardingPayload,
} from '../types/faces.types';

class FacesService {
    async getCatalog(filters: FacesCatalogFilters): Promise<PaginatedApiResponse<ModelCard>['data']> {
        const { data } = await apiClient.get<PaginatedApiResponse<ModelCard>>(
            API_ENDPOINTS.FACES.CATALOG,
            { params: filters },
        );
        return data.data;
    }

    async getDetail(id: string): Promise<ModelDetail> {
        const { data } = await apiClient.get<ApiResponse<ModelDetail>>(API_ENDPOINTS.FACES.DETAIL(id));
        return data.data;
    }

    async addInterest(id: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FACES.INTEREST(id));
    }

    async removeInterest(id: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.FACES.INTEREST(id));
    }

    async getInterestStatus(modelIds: string[]): Promise<Record<string, boolean>> {
        const { data } = await apiClient.get<ApiResponse<Record<string, boolean>>>(
            API_ENDPOINTS.FACES.INTEREST_STATUS,
            { params: { modelIds: modelIds.join(',') } },
        );
        return data.data;
    }

    async getMe(): Promise<MyModelProfile> {
        const { data } = await apiClient.get<ApiResponse<MyModelProfile>>(API_ENDPOINTS.FACES.ME);
        return data.data;
    }

    async uploadPhoto(file: File): Promise<OwnerPhoto> {
        const form = new FormData();
        form.append('photo', file);
        const { data } = await apiClient.post<ApiResponse<OwnerPhoto>>(API_ENDPOINTS.FACES.PHOTOS, form);
        return data.data;
    }

    async deletePhoto(photoId: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.FACES.PHOTO(photoId));
    }

    async setPrimaryPhoto(photoId: string): Promise<void> {
        await apiClient.patch(API_ENDPOINTS.FACES.PHOTO_PRIMARY(photoId));
    }

    async requestReview(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FACES.REQUEST_REVIEW);
    }

    async blur(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FACES.BLUR);
    }

    async unblur(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FACES.UNBLUR);
    }

    async withdraw(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FACES.WITHDRAW);
    }

    async onboard(payload: ModelOnboardingPayload): Promise<void> {
        await apiClient.post(API_ENDPOINTS.ONBOARDING.COMPLETE, payload);
    }
}

export const facesService = new FacesService();
