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
    createdAt: string;
    dailyUsage: { used: number; limit: number } | null;
}

export interface AdminStats {
    totalUsers: number;
    totalJobs: number;
    totalCaptions: number;
    activeSubscriptions: Record<string, number>;
}
