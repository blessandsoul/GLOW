import type { PlanConfig, SubscriptionPlan } from './subscriptions.types.js';

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    id: 'FREE',
    monthlyCredits: 3,
    maxPortfolioItems: 12,
    brandingEnabled: false,
    captionsEnabled: false,
    batchUploadEnabled: false,
    maxBatchSize: 1,
    watermarkFree: false,
    priorityProcessing: false,
    prices: { low: 0, mid: 0, pro: 0 },
  },
  PRO: {
    id: 'PRO',
    monthlyCredits: 50,
    maxPortfolioItems: null,
    brandingEnabled: true,
    captionsEnabled: true,
    batchUploadEnabled: false,
    maxBatchSize: 1,
    watermarkFree: true,
    priorityProcessing: false,
    prices: { low: 900, mid: 2700, pro: 10900 }, // tetri
  },
  ULTRA: {
    id: 'ULTRA',
    monthlyCredits: 200,
    maxPortfolioItems: null,
    brandingEnabled: true,
    captionsEnabled: true,
    batchUploadEnabled: true,
    maxBatchSize: 20,
    watermarkFree: true,
    priorityProcessing: true, // flag stored, not enforced yet
    prices: { low: 1900, mid: 4900, pro: 12900 }, // tetri
  },
};

export const SUBSCRIPTION_PERIOD_DAYS = 30;

export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIGS[plan as SubscriptionPlan] ?? PLAN_CONFIGS.FREE;
}
