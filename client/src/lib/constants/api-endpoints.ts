export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
    },
    UPLOAD: '/upload',
    JOBS: {
        GET: (id: string) => `/jobs/${id}`,
        LIST: '/jobs',
        GUEST: '/jobs/guest',
        BATCH: '/jobs/batch',
        DOWNLOAD: (id: string, variant: number) => `/jobs/${id}/download?variant=${variant}`,
    },
    CREDITS: {
        BALANCE: '/credits/balance',
        PACKAGES: '/credits/packages',
        PURCHASE: '/credits/purchase',
        HISTORY: '/credits/history',
    },
    REFERRALS: {
        STATS: '/referrals/my',
    },
    SHOWCASE: {
        GET: (jobId: string) => `/showcase/${jobId}`,
        REVIEW: (jobId: string) => `/showcase/${jobId}/review`,
    },
} as const;
