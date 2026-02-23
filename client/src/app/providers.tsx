'use client';

import { useState, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import axios from 'axios';
import { store } from '@/store';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { setUser, setInitialized } from '@/features/auth/store/authSlice';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { IUser } from '@/features/auth/types/auth.types';

function AuthHydrator({ children }: { children: React.ReactNode }): React.ReactElement {
    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        // Use bare axios (not apiClient) to bypass the 401 interceptor.
        // This is a silent session check — if it fails, user stays logged out.
        axios
            .get<ApiResponse<IUser>>(
                `${baseUrl}${API_ENDPOINTS.AUTH.ME}`,
                { withCredentials: true },
            )
            .then((res) => {
                // setUser also sets isInitializing = false
                store.dispatch(setUser(res.data.data));
            })
            .catch(() => {
                // No valid session — mark auth as initialized (unauthenticated).
                store.dispatch(setInitialized());
                // Clear any stale cookies so middleware
                // doesn't keep redirecting to protected pages.
                axios
                    .post(`${baseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {}, { withCredentials: true })
                    .catch(() => {
                        document.cookie = 'accessToken=; path=/; max-age=0';
                    });
            });
    }, []);

    return <>{children}</>;
}

export function Providers({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    const [queryClient] = useState(() => new QueryClient());

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
                            <Toaster position="top-right" richColors />
                        </AuthHydrator>
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ReduxProvider>
    );
}
