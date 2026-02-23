import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { BrandingProfile, BrandingFormData } from '../types/branding.types';

class BrandingService {
    async getProfile(): Promise<BrandingProfile | null> {
        const { data } = await apiClient.get<ApiResponse<BrandingProfile | null>>(
            API_ENDPOINTS.BRANDING.ME,
        );
        return data.data;
    }

    async saveProfile(formData: BrandingFormData): Promise<BrandingProfile> {
        const payload = new FormData();
        payload.append('displayName', formData.displayName);
        payload.append('instagramHandle', formData.instagramHandle);
        payload.append('primaryColor', formData.primaryColor);
        payload.append('watermarkStyle', formData.watermarkStyle);
        payload.append('watermarkOpacity', String(formData.watermarkOpacity));
        if (formData.logo) payload.append('logo', formData.logo);

        const { data } = await apiClient.put<ApiResponse<BrandingProfile>>(
            API_ENDPOINTS.BRANDING.ME,
            payload,
            { headers: { 'Content-Type': undefined } },
        );
        return data.data;
    }

    async deleteProfile(): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.BRANDING.ME);
    }
}

export const brandingService = new BrandingService();
