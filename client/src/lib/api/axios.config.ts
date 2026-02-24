import axios from 'axios';
import { store } from '@/store';
import { queryClient } from '@/app/providers';
import { logout } from '@/features/auth/store/authSlice';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Response interceptor: handle 401 with token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown): void => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(undefined);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const url = originalRequest.url as string;
            if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
                    {},
                    { withCredentials: true },
                );
                processQueue(null);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                queryClient.clear();
                store.dispatch(logout());
                if (typeof window !== 'undefined') {
                    // Clear httpOnly cookies via server before redirecting,
                    // otherwise middleware sees stale cookie and bounces back.
                    try {
                        await axios.post(
                            `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`,
                            {},
                            { withCredentials: true },
                        );
                    } catch {
                        // Best-effort — clear any non-httpOnly stale cookie as fallback
                        document.cookie = 'accessToken=; path=/; max-age=0';
                    }
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export { apiClient };
