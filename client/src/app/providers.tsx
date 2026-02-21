'use client';

import { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { store } from '@/store';
import { LanguageProvider } from '@/i18n/LanguageProvider';

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
                        {children}
                        <Toaster position="top-right" richColors />
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ReduxProvider>
    );
}
