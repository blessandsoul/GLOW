import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ShowcaseData, ReviewFormData, Review } from '../types/showcase.types';

class ShowcaseService {
    async getShowcase(jobId: string): Promise<ShowcaseData> {
        const { data } = await apiClient.get<ApiResponse<ShowcaseData>>(
            API_ENDPOINTS.SHOWCASE.GET(jobId),
        );
        return data.data;
    }

    async submitReview(jobId: string, review: ReviewFormData): Promise<Review> {
        const { data } = await apiClient.post<ApiResponse<Review>>(
            API_ENDPOINTS.SHOWCASE.REVIEW(jobId),
            review,
        );
        return data.data;
    }
}

export const showcaseService = new ShowcaseService();
