import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse, PaginationMeta } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { AdminUser, AdminStats } from '../types/admin.types';

class AdminService {
    async getUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{ items: AdminUser[]; pagination: PaginationMeta }> {
        const { data } = await apiClient.get<PaginatedApiResponse<AdminUser>>(
            API_ENDPOINTS.ADMIN.USERS,
            { params },
        );
        return {
            items: data.data.items,
            pagination: data.data.pagination,
        };
    }

    async getStats(): Promise<AdminStats> {
        const { data } = await apiClient.get<ApiResponse<AdminStats>>(
            API_ENDPOINTS.ADMIN.STATS,
        );
        return data.data;
    }

    async flushDailyLimits(): Promise<{ deletedKeys: number }> {
        const { data } = await apiClient.post<ApiResponse<{ deletedKeys: number }>>(
            API_ENDPOINTS.ADMIN.FLUSH_DAILY_LIMITS,
        );
        return data.data;
    }
}

export const adminService = new AdminService();
