export type SubscriptionPlan = 'FREE' | 'PRO' | 'ULTRA';
export type SubscriptionQuality = 'low' | 'mid' | 'pro';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface SubscriptionFeatures {
    maxPortfolioItems: number | null;
    brandingEnabled: boolean;
    captionsEnabled: boolean;
    batchUploadEnabled: boolean;
    maxBatchSize: number;
    watermarkFree: boolean;
}

export interface Subscription {
    id: string;
    plan: SubscriptionPlan;
    quality: SubscriptionQuality;
    status: SubscriptionStatus;
    autoRenew: boolean;
    cancelledAt: string | null;
    currentPeriodEnd: string;
    monthlyCredits: number;
    features: SubscriptionFeatures;
    createdAt: string;
}

export interface PlanInfo {
    id: SubscriptionPlan;
    monthlyCredits: number;
    maxPortfolioItems: number | null;
    brandingEnabled: boolean;
    captionsEnabled: boolean;
    batchUploadEnabled: boolean;
    maxBatchSize: number;
    watermarkFree: boolean;
    prices: Record<SubscriptionQuality, number>;
}

export interface SubscribeRequest {
    plan: 'PRO' | 'ULTRA';
    quality: SubscriptionQuality;
}
