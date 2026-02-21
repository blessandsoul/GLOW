export interface CreditBalance {
    credits: number;
    totalEarned?: number;
    totalSpent?: number;
}

export interface CreditPackage {
    id: string;
    name: string;
    description: string | null;
    credits: number;
    price: number;
    currency: string;
    isActive: boolean;
    sortOrder: number;
}

export interface CreditTransaction {
    id: string;
    userId: string;
    delta: number;
    reason: string;
    jobId: string | null;
    createdAt: string;
}

export interface CreditPurchaseRequest {
    packageId: string;
}
