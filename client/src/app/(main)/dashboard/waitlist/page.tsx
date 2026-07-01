'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ShareWaitlistLink } from '@/features/waitlist/components/ShareWaitlistLink';
import { MasterWaitlistBoard } from '@/features/waitlist/components/MasterWaitlistBoard';

export default function DashboardWaitlistPage(): React.ReactElement {
    const router = useRouter();
    const { t } = useLanguage();
    const { isAuthenticated, user, isInitializing } = useAppSelector((s) => s.auth);

    const allowed = user?.role === 'MASTER' || user?.role === 'ADMIN';

    useEffect(() => {
        if (isInitializing) return;
        if (!isAuthenticated) {
            router.replace(ROUTES.LOGIN);
            return;
        }
        if (!allowed) {
            router.replace(ROUTES.DASHBOARD);
        }
    }, [isAuthenticated, isInitializing, allowed, router]);

    // Gate rendering on auth + role so unauthorized users never see the board flash
    // or fire the 401-bound board query before the redirect lands.
    if (isInitializing || !isAuthenticated || !allowed) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">{t('waitlist.board_title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('waitlist.board_subtitle')}</p>
            </div>

            {user?.username && (
                <div className="mb-6">
                    <ShareWaitlistLink username={user.username} />
                </div>
            )}

            <MasterWaitlistBoard />
        </div>
    );
}
