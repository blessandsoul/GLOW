import { creditsRepo } from './credits.repo.js';
import { NotFoundError } from '../../shared/errors/errors.js';

export const PROCESSING_COSTS: Record<string, number> = {
  ENHANCE: 1,
  RETOUCH: 2,
  BACKGROUND: 2,
  PRO_EDIT: 3,
};

// Client sends quality-size combos like "pro-m", "mid-s", "low-l".
// Map these to credits and price (in tetri) to match the client pricing.
const PACKAGE_CONFIG: Record<string, { credits: number; price: number; currency: string }> = {
  'low-s':  { credits: 10, price: 150,   currency: 'GEL' },
  'low-m':  { credits: 30, price: 390,   currency: 'GEL' },
  'low-l':  { credits: 70, price: 790,   currency: 'GEL' },
  'mid-s':  { credits: 10, price: 550,   currency: 'GEL' },
  'mid-m':  { credits: 30, price: 1490,  currency: 'GEL' },
  'mid-l':  { credits: 70, price: 2990,  currency: 'GEL' },
  'pro-s':  { credits: 10, price: 2190,  currency: 'GEL' },
  'pro-m':  { credits: 30, price: 5990,  currency: 'GEL' },
  'pro-l':  { credits: 70, price: 12900, currency: 'GEL' },
};

interface BalanceInfo {
  credits: number;
  totalEarned: number;
  totalSpent: number;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

interface CreditTransaction {
  id: string;
  delta: number;
  reason: string;
  jobId: string | null;
  createdAt: Date;
}

export const creditsService = {
  async getBalance(userId: string): Promise<BalanceInfo> {
    const [credits, summary] = await Promise.all([
      creditsRepo.getBalance(userId),
      creditsRepo.getTransactionSummary(userId),
    ]);

    return {
      credits,
      totalEarned: summary.totalEarned,
      totalSpent: summary.totalSpent,
    };
  },

  async getPackages(): Promise<CreditPackage[]> {
    return creditsRepo.getActivePackages();
  },

  async purchasePackage(userId: string, packageId: string): Promise<number> {
    // Try DB lookup first (UUID-based packages)
    const pkg = await creditsRepo.getPackageById(packageId);

    if (pkg && pkg.isActive) {
      return creditsRepo.purchasePackage(
        userId,
        pkg.id,
        pkg.credits,
        pkg.price,
        pkg.currency,
      );
    }

    // Fallback: quality-size format from client (e.g. "pro-m", "mid-s")
    const config = PACKAGE_CONFIG[packageId];
    if (!config) {
      throw new NotFoundError(
        'Credit package not found or inactive',
        'PACKAGE_NOT_FOUND',
      );
    }

    return creditsRepo.purchasePackage(
      userId,
      packageId,
      config.credits,
      config.price,
      config.currency,
    );
  },

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: CreditTransaction[]; totalItems: number }> {
    return creditsRepo.getTransactions(userId, page, limit);
  },

  async deductForJob(userId: string, processingType: string): Promise<number> {
    const cost = PROCESSING_COSTS[processingType] ?? 1;
    return creditsRepo.deductCredits(userId, cost, 'JOB_PROCESSING');
  },
};
