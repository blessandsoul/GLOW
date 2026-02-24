import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { Subscription, PlanInfo, SubscribeRequest } from '../types/subscription.types';

class SubscriptionService {
    async getPlans(): Promise<PlanInfo[]> {
        const { data } = await apiClient.get<ApiResponse<PlanInfo[]>>(
            API_ENDPOINTS.SUBSCRIPTIONS.PLANS,
        );
        return data.data;
    }

    async getCurrent(): Promise<Subscription | null> {
        const { data } = await apiClient.get<ApiResponse<Subscription | null>>(
            API_ENDPOINTS.SUBSCRIPTIONS.CURRENT,
        );
        return data.data;
    }

    async subscribe(input: SubscribeRequest): Promise<Subscription> {
        const { data } = await apiClient.post<ApiResponse<Subscription>>(
            API_ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBE,
            input,
        );
        return data.data;
    }

    async cancel(): Promise<Subscription> {
        const { data } = await apiClient.post<ApiResponse<Subscription>>(
            API_ENDPOINTS.SUBSCRIPTIONS.CANCEL,
        );
        return data.data;
    }

    async reactivate(): Promise<Subscription> {
        const { data } = await apiClient.post<ApiResponse<Subscription>>(
            API_ENDPOINTS.SUBSCRIPTIONS.REACTIVATE,
        );
        return data.data;
    }
}

export const subscriptionService = new SubscriptionService();
