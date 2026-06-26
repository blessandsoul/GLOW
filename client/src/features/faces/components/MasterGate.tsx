'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';

/**
 * Client-side gate for the Faces catalog: only MASTER and ADMIN may view.
 * The API also enforces this (authorize('MASTER','ADMIN')), this is the UX layer.
 */
export function MasterGate({ children }: { children: React.ReactNode }): React.ReactElement {
    const router = useRouter();
    const { isAuthenticated, user, isInitializing } = useAppSelector((s) => s.auth);
    const allowed = user?.role === 'MASTER' || user?.role === 'ADMIN';

    useEffect(() => {
        if (isInitializing) return;
        if (!isAuthenticated) {
            router.replace(ROUTES.LOGIN);
            return;
        }
        if (!allowed) {
            router.replace(ROUTES.HOME);
        }
    }, [isAuthenticated, allowed, isInitializing, router]);

    if (isInitializing || !isAuthenticated || !allowed) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}
