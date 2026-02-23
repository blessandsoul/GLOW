import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { MasterProfile, ProfileFormData } from '../types/profile.types';

class ProfileService {
    async getProfile(): Promise<MasterProfile | null> {
        const { data } = await apiClient.get<ApiResponse<MasterProfile | null>>(
            API_ENDPOINTS.PROFILES.ME,
        );
        return data.data;
    }

    async saveProfile(formData: ProfileFormData): Promise<MasterProfile> {
        const { data } = await apiClient.put<ApiResponse<MasterProfile>>(
            API_ENDPOINTS.PROFILES.ME,
            formData,
        );
        return data.data;
    }
}

export const profileService = new ProfileService();
