'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import { ModelDashboard } from '@/features/faces/components/ModelDashboard';

export default function DashboardModelPage(): React.ReactElement {
    const router = useRouter();
    const { isAuthenticated, user, isInitializing } = useAppSelector((s) => s.auth);

    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.replace(ROUTES.LOGIN);
        }
    }, [isAuthenticated, isInitializing, router]);

    useEffect(() => {
        if (!isInitializing && isAuthenticated && user && user.role !== 'MODEL') {
            router.replace(ROUTES.DASHBOARD);
        }
    }, [isAuthenticated, isInitializing, user, router]);

    if (isInitializing) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <ModelDashboard />;
}
