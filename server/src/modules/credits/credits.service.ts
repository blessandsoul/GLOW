import { creditsRepo } from './credits.repo.js';
import { NotFoundError } from '../../shared/errors/errors.js';

export const PROCESSING_COSTS: Record<string, number> = {
  ENHANCE: 1,
  RETOUCH: 2,
  BACKGROUND: 2,
  PRO_EDIT: 3,
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
    const pkg = await creditsRepo.getPackageById(packageId);

    if (!pkg || !pkg.isActive) {
      throw new NotFoundError(
        'Credit package not found or inactive',
        'PACKAGE_NOT_FOUND',
      );
    }

    const updatedBalance = await creditsRepo.purchasePackage(
      userId,
      pkg.id,
      pkg.credits,
      pkg.price,
      pkg.currency,
    );

    return updatedBalance;
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
