export const API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
        VERIFY_EMAIL: '/auth/verify-email',
        REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
    },
    USERS: {
        ME: '/users/me',
        AVATAR: '/users/me/avatar',
    },
    PROFILES: {
        ME: '/profiles/me',
    },
    BRANDING: {
        ME: '/branding/me',
    },
    PORTFOLIO: {
        ME: '/portfolio/me',
        CREATE: '/portfolio',
        UPDATE: (id: string) => `/portfolio/${id}`,
        DELETE: (id: string) => `/portfolio/${id}`,
        PUBLIC: (username: string) => `/portfolio/public/${username}`,
    },
    TRENDS: {
        CURRENT: '/trends/current',
        ARCHIVE: '/trends/archive',
    },
    FILTERS: {
        LIST: '/filters',
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
