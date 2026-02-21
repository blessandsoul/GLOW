import type { PaginationMeta } from '@/lib/api/api.types';
import type { CreditBalance, CreditPackage, CreditTransaction } from '../types/credits.types';

// ── Mock state (in-memory) ────────────────────────────────────────────────────
const PACKAGE_CREDITS: Record<string, number> = {
    'low-s': 10, 'low-m': 30, 'low-l': 70,
    'mid-s': 10, 'mid-m': 30, 'mid-l': 70,
    'pro-s': 10, 'pro-m': 30, 'pro-l': 70,
};

let mockBalance = 5;
const mockHistory: CreditTransaction[] = [];

class CreditsService {
    async getBalance(): Promise<CreditBalance> {
        return { credits: mockBalance };
    }

    async getPackages(): Promise<CreditPackage[]> {
        return [];
    }

    async purchasePackage(packageId: string): Promise<CreditBalance> {
        const credits = PACKAGE_CREDITS[packageId] ?? 10;
        mockBalance += credits;
        mockHistory.unshift({
            id: crypto.randomUUID(),
            userId: 'mock-user',
            delta: credits,
            reason: 'PACKAGE_PURCHASE',
            createdAt: new Date().toISOString(),
        });
        return { credits: mockBalance };
    }

    async getHistory(
        page: number = 1,
        limit: number = 10,
    ): Promise<{ items: CreditTransaction[]; pagination: PaginationMeta }> {
        const start = (page - 1) * limit;
        const items = mockHistory.slice(start, start + limit);
        return {
            items,
            pagination: {
                page,
                limit,
                totalItems: mockHistory.length,
                totalPages: Math.max(1, Math.ceil(mockHistory.length / limit)),
                hasNextPage: start + limit < mockHistory.length,
                hasPreviousPage: page > 1,
            },
        };
    }

    async useCredit(_jobId: string): Promise<void> {
        return Promise.resolve();
    }
}

export const creditsService = new CreditsService();
