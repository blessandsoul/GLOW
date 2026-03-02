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
        VERIFY_PHONE: '/auth/verify-phone',
        RESEND_OTP: '/auth/resend-otp',
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
        UPLOAD: '/portfolio/upload',
        REORDER: '/portfolio/reorder',
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
        RESULTS: '/jobs/results',
        GUEST: '/jobs/guest',
        BATCH: '/jobs/batch',
        DOWNLOAD: (id: string, variant: number, upscale?: boolean) => `/jobs/${id}/download?variant=${variant}${upscale ? '&upscale=1' : ''}`,
        PREPARE_HD: (id: string, variant: number) => `/jobs/${id}/prepare-hd?variant=${variant}`,
        DELETE: (id: string) => `/jobs/${id}`,
        BULK_DELETE: '/jobs/bulk',
        STATS: '/jobs/stats',
    },
    CREDITS: {
        BALANCE: '/credits/balance',
        PACKAGES: '/credits/packages',
        PURCHASE: '/credits/purchase',
        HISTORY: '/credits/history',
    },
    SUBSCRIPTIONS: {
        PLANS: '/subscriptions/plans',
        CURRENT: '/subscriptions/current',
        SUBSCRIBE: '/subscriptions/subscribe',
        CANCEL: '/subscriptions/cancel',
        REACTIVATE: '/subscriptions/reactivate',
    },
    REFERRALS: {
        STATS: '/referrals/my',
    },
    CAPTIONS: {
        GENERATE: (jobId: string) => `/captions/${jobId}`,
        GET: (jobId: string) => `/captions/${jobId}`,
    },
    SHOWCASE: {
        GET: (jobId: string) => `/showcase/${jobId}`,
        REVIEW: (jobId: string) => `/showcase/${jobId}/review`,
    },
    ADMIN: {
        USERS: '/admin/users',
        STATS: '/admin/stats',
        FLUSH_DAILY_LIMITS: '/admin/flush-daily-limits',
    },
    CHAT: {
        MESSAGE: '/chat/message',
    },
    DECORATIONS: {
        SUGGEST: '/decorations/suggest',
    },
    CATALOG: {
        SPECIALITIES: '/catalog/specialities',
        SERVICE_CATEGORIES: '/catalog/service-categories',
    },
} as const;
