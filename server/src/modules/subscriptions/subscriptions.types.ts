export type SubscriptionPlan = 'FREE' | 'PRO' | 'ULTRA';
export type SubscriptionQuality = 'low' | 'mid' | 'pro';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface PlanConfig {
  id: SubscriptionPlan;
  monthlyCredits: number;
  maxPortfolioItems: number | null; // null = unlimited
  brandingEnabled: boolean;
  captionsEnabled: boolean;
  batchUploadEnabled: boolean;
  maxBatchSize: number;
  watermarkFree: boolean;
  priorityProcessing: boolean; // flag only, not implemented yet
  prices: Record<SubscriptionQuality, number>; // in tetri (GEL × 100)
}

export interface SubscriptionResponse {
  id: string;
  plan: SubscriptionPlan;
  quality: SubscriptionQuality;
  status: SubscriptionStatus;
  autoRenew: boolean;
  cancelledAt: string | null;
  currentPeriodEnd: string;
  monthlyCredits: number;
  features: {
    maxPortfolioItems: number | null;
    brandingEnabled: boolean;
    captionsEnabled: boolean;
    batchUploadEnabled: boolean;
    maxBatchSize: number;
    watermarkFree: boolean;
  };
  createdAt: string;
}
