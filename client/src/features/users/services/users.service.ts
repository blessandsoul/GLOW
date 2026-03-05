import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { IUser } from '@/features/auth/types/auth.types';

interface UpdateMeRequest {
    firstName?: string;
    lastName?: string;
}

class UsersService {
    async updateMe(data: UpdateMeRequest): Promise<IUser> {
        const response = await apiClient.patch<ApiResponse<IUser>>(
            API_ENDPOINTS.USERS.ME,
            data,
        );
        return response.data.data;
    }

    async deleteRequestOtp(): Promise<{ requestId: string }> {
        const response = await apiClient.post<ApiResponse<{ requestId: string }>>(
            API_ENDPOINTS.USERS.DELETE_REQUEST_OTP,
        );
        return response.data.data;
    }

    async deleteMe(otpRequestId: string, code: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.USERS.ME, {
            data: { otpRequestId, code },
        });
    }

    async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
            API_ENDPOINTS.USERS.AVATAR,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return response.data.data;
    }
}

export const usersService = new UsersService();
