import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { PortfolioItem, PortfolioItemFormData, PublicPortfolioData } from '../types/portfolio.types';
import type { ReorderPayload } from '../types/builder.types';

class PortfolioService {
    async getMyPortfolio(): Promise<PortfolioItem[]> {
        const { data } = await apiClient.get<ApiResponse<PortfolioItem[]>>(
            API_ENDPOINTS.PORTFOLIO.ME,
        );
        return data.data;
    }

    async addItem(itemData: PortfolioItemFormData): Promise<PortfolioItem> {
        const { data } = await apiClient.post<ApiResponse<PortfolioItem>>(
            API_ENDPOINTS.PORTFOLIO.CREATE,
            itemData,
        );
        return data.data;
    }

    async updateItem(id: string, itemData: Partial<PortfolioItemFormData>): Promise<PortfolioItem> {
        const { data } = await apiClient.patch<ApiResponse<PortfolioItem>>(
            API_ENDPOINTS.PORTFOLIO.UPDATE(id),
            itemData,
        );
        return data.data;
    }

    async deleteItem(id: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.PORTFOLIO.DELETE(id));
    }

    async uploadImage(file: File, title?: string, niche?: string): Promise<PortfolioItem> {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);
        if (niche) formData.append('niche', niche);

        const { data } = await apiClient.post<ApiResponse<PortfolioItem>>(
            API_ENDPOINTS.PORTFOLIO.UPLOAD,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async reorderItems(payload: ReorderPayload): Promise<PortfolioItem[]> {
        const { data } = await apiClient.patch<ApiResponse<PortfolioItem[]>>(
            API_ENDPOINTS.PORTFOLIO.REORDER,
            payload,
        );
        return data.data;
    }

    async getPublicPortfolio(username: string): Promise<PublicPortfolioData> {
        const { data } = await apiClient.get<ApiResponse<PublicPortfolioData>>(
            API_ENDPOINTS.PORTFOLIO.PUBLIC(username),
        );
        return data.data;
    }
}

export const portfolioService = new PortfolioService();
