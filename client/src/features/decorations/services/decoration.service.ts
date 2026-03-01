import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';

export interface GeneratedDecoration {
    label_en: string;
    label_ru: string;
    label_ka: string;
    promptValue: string;
}

class DecorationService {
    async suggestDecorations(niche: string): Promise<GeneratedDecoration[]> {
        const { data } = await apiClient.post<ApiResponse<GeneratedDecoration[]>>(
            API_ENDPOINTS.DECORATIONS.SUGGEST,
            { niche },
        );
        return data.data;
    }
}

export const decorationService = new DecorationService();
