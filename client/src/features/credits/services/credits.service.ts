import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse, PaginationMeta } from '@/lib/api/api.types';
import type { CreditBalance, CreditPackage, CreditTransaction } from '../types/credits.types';

class CreditsService {
    async getBalance(): Promise<CreditBalance> {
        const { data } = await apiClient.get<ApiResponse<CreditBalance>>(
            API_ENDPOINTS.CREDITS.BALANCE,
        );
        return data.data;
    }

    async getPackages(): Promise<CreditPackage[]> {
        const { data } = await apiClient.get<ApiResponse<CreditPackage[]>>(
            API_ENDPOINTS.CREDITS.PACKAGES,
        );
        return data.data;
    }

    async purchasePackage(packageId: string): Promise<CreditBalance> {
        const { data } = await apiClient.post<ApiResponse<{ credits: number }>>(
            API_ENDPOINTS.CREDITS.PURCHASE,
            { packageId },
        );
        return { credits: data.data.credits };
    }

    async getHistory(
        page: number = 1,
        limit: number = 10,
        type?: 'earned' | 'spent',
    ): Promise<{ items: CreditTransaction[]; pagination: PaginationMeta }> {
        const params: Record<string, string | number> = { page, limit };
        if (type) params.type = type;

        const { data } = await apiClient.get<PaginatedApiResponse<CreditTransaction>>(
            API_ENDPOINTS.CREDITS.HISTORY,
            { params },
        );
        return data.data;
    }
}

export const creditsService = new CreditsService();
