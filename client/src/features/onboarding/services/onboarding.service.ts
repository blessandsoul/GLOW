import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { IUser } from '@/features/auth/types/auth.types';

class OnboardingService {
    async complete(data: Record<string, unknown>): Promise<{ user: IUser }> {
        const response = await apiClient.post<ApiResponse<{ user: IUser }>>(
            API_ENDPOINTS.ONBOARDING.COMPLETE,
            data,
        );
        return response.data.data;
    }
}

export const onboardingService = new OnboardingService();
