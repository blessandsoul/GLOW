export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string | null;
    avatar: string | null;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    credits: number;
    plan: string;
    jobCount: number;
    captionCount: number;
    hdUpscaleCount: number;
    createdAt: string;
    dailyUsage: { used: number; limit: number } | null;
}

export interface AdminStats {
    totalUsers: number;
    totalJobs: number;
    totalCaptions: number;
    totalHdUpscales: number;
    activeSubscriptions: Record<string, number>;
}

export interface AdminUserImage {
    jobId: string;
    originalUrl: string;
    imageUrl: string;
    variantIndex: number;
    createdAt: string;
}
