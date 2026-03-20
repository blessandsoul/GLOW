export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string | null;
    avatar: string | null;
    phone: string | null;
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
    verificationStatus: string;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    isTopRated: boolean;
    masterTier: string;
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
    verificationStatus: string;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    isTopRated: boolean;
    masterTier: string;
    idDocumentUrl: string | null;
    certificateUrl: string | null;
    hygienePicsUrl: string[] | null;
    qualityProductsUrl: string[] | null;
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

export interface VariablePoolCount {
    variableId: string;
    count: number;
}

export interface VariablePoolStatus {
    counts: VariablePoolCount[];
}

export type BulkSmsMode = 'all' | 'custom';

export interface BulkSmsRequest {
    message: string;
    mode: BulkSmsMode;
    phoneNumbers?: string[];
}

export interface BulkSmsResult {
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
    errors: string[];
}

export interface VerifiedPhoneCount {
    count: number;
}
