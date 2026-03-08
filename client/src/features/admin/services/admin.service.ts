import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse, PaginationMeta } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { AdminUser, AdminStats, AdminUserImage, AdminPortfolioUser, AdminPortfolioItem, DecorationPoolStatus } from '../types/admin.types';

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

    async getUserImages(
        userId: string,
        params?: { page?: number; limit?: number },
    ): Promise<{ items: AdminUserImage[]; pagination: PaginationMeta }> {
        const { data } = await apiClient.get<PaginatedApiResponse<AdminUserImage>>(
            API_ENDPOINTS.ADMIN.USER_IMAGES(userId),
            { params },
        );
        return {
            items: data.data.items,
            pagination: data.data.pagination,
        };
    }

    async flushDailyLimits(): Promise<{ deleted: boolean }> {
        const { data } = await apiClient.post<ApiResponse<{ deleted: boolean }>>(
            API_ENDPOINTS.ADMIN.FLUSH_DAILY_LIMITS,
        );
        return data.data;
    }

    async getPortfolioUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{ items: AdminPortfolioUser[]; pagination: PaginationMeta }> {
        const { data } = await apiClient.get<PaginatedApiResponse<AdminPortfolioUser>>(
            API_ENDPOINTS.ADMIN.PORTFOLIOS,
            { params },
        );
        return {
            items: data.data.items,
            pagination: data.data.pagination,
        };
    }

    async getPortfolioItems(
        userId: string,
        params?: { page?: number; limit?: number },
    ): Promise<{ items: AdminPortfolioItem[]; pagination: PaginationMeta }> {
        const { data } = await apiClient.get<PaginatedApiResponse<AdminPortfolioItem>>(
            API_ENDPOINTS.ADMIN.PORTFOLIO_ITEMS(userId),
            { params },
        );
        return {
            items: data.data.items,
            pagination: data.data.pagination,
        };
    }
    async getDecorationPoolStatus(): Promise<DecorationPoolStatus> {
        const { data } = await apiClient.get<ApiResponse<DecorationPoolStatus>>(
            API_ENDPOINTS.DECORATIONS.POOL_STATUS,
        );
        return data.data;
    }

    async replenishDecorationPool(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.DECORATIONS.REPLENISH);
    }
}

export const adminService = new AdminService();
