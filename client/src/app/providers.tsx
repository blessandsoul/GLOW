'use client';

import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CheckCircle, XCircle, WarningCircle, Info, SpinnerGap } from '@phosphor-icons/react';
import axios from 'axios';
import { store } from '@/store';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { setUser, setInitialized } from '@/features/auth/store/authSlice';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { IUser } from '@/features/auth/types/auth.types';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function AuthHydrator({ children }: { children: React.ReactNode }): React.ReactElement {
    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        // Use bare axios (not apiClient) to avoid racing with the 401 interceptor.
        const hydrateAuth = async (): Promise<void> => {
            // Step 1: Try /auth/me with current access token cookie
            try {
                const res = await axios.get<ApiResponse<IUser>>(
                    `${baseUrl}${API_ENDPOINTS.AUTH.ME}`,
                    { withCredentials: true },
                );
                store.dispatch(setUser(res.data.data));
                // Redirect unverified users to phone verification (only if they have a phone)
                const userData = res.data.data;
                if (userData.phone && !userData.isPhoneVerified && typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    const allowedUnverified = ['/verify-phone', '/login', '/register'];
                    if (!allowedUnverified.some(p => currentPath.startsWith(p))) {
                        window.location.href = '/verify-phone';
                        return;
                    }
                }
                return;
            } catch (meError: unknown) {
                // Only attempt refresh on 401 (expired token).
                // Network errors / server down → don't destroy the session.
                if (!axios.isAxiosError(meError) || meError.response?.status !== 401) {
                    store.dispatch(setInitialized());
                    return;
                }
            }

            // Step 2: Access token expired (401). Try refreshing.
            try {
                await axios.post(
                    `${baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
                    {},
                    { withCredentials: true },
                );
            } catch {
                // Refresh failed — session is truly invalid.
                // Don't call /logout — the refresh token is already invalid/expired.
                store.dispatch(setInitialized());
                document.cookie = 'accessToken=; path=/; max-age=0';
                document.cookie = 'session=; path=/; max-age=0';
                return;
            }

            // Step 3: Refresh succeeded — retry /auth/me with new access token
            try {
                const retryRes = await axios.get<ApiResponse<IUser>>(
                    `${baseUrl}${API_ENDPOINTS.AUTH.ME}`,
                    { withCredentials: true },
                );
                store.dispatch(setUser(retryRes.data.data));
                // Redirect unverified users to phone verification (only if they have a phone)
                const retryUserData = retryRes.data.data;
                if (retryUserData.phone && !retryUserData.isPhoneVerified && typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    const allowedUnverified = ['/verify-phone', '/login', '/register'];
                    if (!allowedUnverified.some(p => currentPath.startsWith(p))) {
                        window.location.href = '/verify-phone';
                        return;
                    }
                }
            } catch {
                store.dispatch(setInitialized());
            }
        };

        hydrateAuth();
    }, []);

    return <>{children}</>;
}

export function Providers({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <LanguageProvider>
                        <AuthHydrator>
                            {children}
                            <Toaster
                                position="bottom-left"
                                richColors
                                closeButton
                                toastOptions={{
                                    classNames: {
                                        toast: 'group/toast',
                                        closeButton: 'opacity-0 group-hover/toast:opacity-100 transition-opacity',
                                    },
                                }}
                                icons={{
                                    success: <CheckCircle weight="fill" size={16} />,
                                    error: <XCircle weight="fill" size={16} />,
                                    warning: <WarningCircle weight="fill" size={16} />,
                                    info: <Info weight="fill" size={16} />,
                                    loading: <SpinnerGap size={16} className="animate-spin" />,
                                }}
                            />
                        </AuthHydrator>
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ReduxProvider>
    );
}
