'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAppSelector } from '@/store/hooks';
import { useAdminStats } from '@/features/admin/hooks/useAdmin';
import { AdminStatsCards } from '@/features/admin/components/AdminStatsCards';
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable';
import { ROUTES } from '@/lib/constants/routes';

function AdminPageContent(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const user = useAppSelector((state) => state.auth.user);
    const isInitializing = useAppSelector((state) => state.auth.isInitializing);

    const { stats, isLoading: statsLoading } = useAdminStats();

    if (isInitializing) {
        return <div className="container mx-auto max-w-6xl px-4 py-12" />;
    }

    if (user?.role !== 'ADMIN') {
        router.replace(ROUTES.DASHBOARD);
        return (
            <div className="container mx-auto max-w-6xl px-4 py-24 text-center">
                <p className="text-muted-foreground">{t('admin.unauthorized')}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
            <h1 className="text-2xl font-semibold tracking-tight">{t('admin.title')}</h1>

            <AdminStatsCards stats={stats} isLoading={statsLoading} />

            <Suspense>
                <AdminUsersTable />
            </Suspense>
        </div>
    );
}

export default function AdminPage(): React.ReactElement {
    return (
        <Suspense>
            <AdminPageContent />
        </Suspense>
    );
}
