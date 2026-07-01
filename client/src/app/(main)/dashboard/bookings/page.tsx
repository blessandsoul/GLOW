'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShareWaitlistLink } from '@/features/waitlist/components/ShareWaitlistLink';
import { MasterWaitlistBoard } from '@/features/waitlist/components/MasterWaitlistBoard';
import { MasterBookingsBoard } from '@/features/booking/components/MasterBookingsBoard';
import { BookingSettingsPanel } from '@/features/booking/components/BookingSettingsPanel';

type TabKey = 'bookings' | 'waitlist' | 'settings';

export default function DashboardBookingsPage(): React.ReactElement {
    const router = useRouter();
    const { t } = useLanguage();
    const { isAuthenticated, user, isInitializing } = useAppSelector((s) => s.auth);
    const [tab, setTab] = useState<TabKey>('bookings');

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
    // or fire the 401-bound board queries before the redirect lands.
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
                <h1 className="text-2xl font-bold text-foreground">{t('booking.board_title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('booking.board_subtitle')}</p>
            </div>

            {user?.username && (
                <div className="mb-6">
                    <ShareWaitlistLink username={user.username} />
                </div>
            )}

            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList className="mb-6">
                    <TabsTrigger value="bookings">{t('booking.tab_bookings')}</TabsTrigger>
                    <TabsTrigger value="waitlist">{t('booking.tab_waitlist')}</TabsTrigger>
                    <TabsTrigger value="settings">{t('booking.tab_settings')}</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings">
                    <MasterBookingsBoard />
                </TabsContent>
                <TabsContent value="waitlist">
                    <MasterWaitlistBoard />
                </TabsContent>
                <TabsContent value="settings">
                    <BookingSettingsPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
