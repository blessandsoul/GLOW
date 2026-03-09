import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Review, CreateReviewRequest, UpdateReviewRequest } from '../types/review.types';

class ReviewService {
    async createReview(data: CreateReviewRequest): Promise<Review> {
        const { data: response } = await apiClient.post<ApiResponse<Review>>(
            API_ENDPOINTS.REVIEWS.CREATE,
            data,
        );
        return response.data;
    }

    async getMyReview(masterId: string): Promise<Review | null> {
        const { data: response } = await apiClient.get<ApiResponse<Review | null>>(
            API_ENDPOINTS.REVIEWS.MY_REVIEW(masterId),
        );
        return response.data;
    }

    async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
        const { data: response } = await apiClient.patch<ApiResponse<Review>>(
            API_ENDPOINTS.REVIEWS.UPDATE(reviewId),
            data,
        );
        return response.data;
    }

    async deleteReview(reviewId: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.REVIEWS.DELETE(reviewId));
    }
}

export const reviewService = new ReviewService();
