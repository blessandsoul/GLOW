import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { Caption } from '../types/caption.types';

class CaptionService {
    async generateCaption(jobId: string, force: boolean = false): Promise<Caption> {
        const url = force
            ? `${API_ENDPOINTS.CAPTIONS.GENERATE(jobId)}?force=true`
            : API_ENDPOINTS.CAPTIONS.GENERATE(jobId);
        const { data } = await apiClient.post<ApiResponse<Caption>>(url);
        return data.data;
    }

    async getCaption(jobId: string): Promise<Caption | null> {
        const { data } = await apiClient.get<ApiResponse<Caption | null>>(
            API_ENDPOINTS.CAPTIONS.GET(jobId),
        );
        return data.data;
    }
}

export const captionService = new CaptionService();
