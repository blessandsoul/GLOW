import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import type {
    PublicMasterServices,
    RequestOtpPayload,
    JoinPayload,
    WaitlistJoinResult,
    WaitlistEntry,
    WaitlistDaySummary,
    WaitlistFilters,
    WaitlistStatus,
} from '../types/waitlist.types';

class WaitlistService {
    async getPublicServices(username: string): Promise<PublicMasterServices> {
        const { data } = await apiClient.get<ApiResponse<PublicMasterServices>>(
            API_ENDPOINTS.WAITLIST.PUBLIC_SERVICES(username),
        );
        return data.data;
    }

    async requestOtp(username: string, payload: RequestOtpPayload): Promise<{ requestId: string }> {
        const { data } = await apiClient.post<ApiResponse<{ requestId: string }>>(
            API_ENDPOINTS.WAITLIST.REQUEST_OTP(username),
            payload,
        );
        return data.data;
    }

    async join(username: string, payload: JoinPayload): Promise<WaitlistJoinResult> {
        const { data } = await apiClient.post<ApiResponse<WaitlistJoinResult>>(
            API_ENDPOINTS.WAITLIST.JOIN(username),
            payload,
        );
        return data.data;
    }

    async getMine(filters: WaitlistFilters): Promise<PaginatedApiResponse<WaitlistEntry>['data']> {
        const { data } = await apiClient.get<PaginatedApiResponse<WaitlistEntry>>(
            API_ENDPOINTS.WAITLIST.MINE,
            { params: filters },
        );
        return data.data;
    }

    async getSummary(): Promise<WaitlistDaySummary[]> {
        const { data } = await apiClient.get<ApiResponse<WaitlistDaySummary[]>>(
            API_ENDPOINTS.WAITLIST.MINE_SUMMARY,
        );
        return data.data;
    }

    async updateStatus(id: string, status: WaitlistStatus): Promise<WaitlistEntry> {
        const { data } = await apiClient.patch<ApiResponse<WaitlistEntry>>(
            API_ENDPOINTS.WAITLIST.UPDATE_STATUS(id),
            { status },
        );
        return data.data;
    }
}

export const waitlistService = new WaitlistService();
