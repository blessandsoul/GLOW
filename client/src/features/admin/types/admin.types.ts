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
    captions: { language: string; text: string; hashtags: string }[];
}

export interface AdminPortfolioUser {
    userId: string;
    firstName: string;
    lastName: string;
    username: string | null;
    avatar: string | null;
    niche: string | null;
    totalItems: number;
    publishedItems: number;
    latestItemDate: string | null;
}

export interface DecorationPoolNicheCount {
    niche: string;
    count: number;
}

export interface DecorationPoolStatus {
    counts: DecorationPoolNicheCount[];
}

export interface AdminPortfolioItem {
    id: string;
    imageUrl: string;
    title: string | null;
    niche: string | null;
    isPublished: boolean;
    sortOrder: number;
    createdAt: string;
}
