'use client';

import Link from 'next/link';
import { Diamond, Camera, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

export function DashboardStatsBar(): React.ReactElement {
    const { t } = useLanguage();
    const { data, isLoading } = useDashboardStats();

    if (isLoading || !data) {
        return <Skeleton className="h-11 rounded-xl" />;
    }

    const creditColor =
        data.credits <= 3
            ? 'text-destructive'
            : data.credits <= 10
              ? 'text-warning'
              : 'text-foreground';

    const planUpper = data.plan.toUpperCase();

    const planClasses =
        planUpper === 'PRO'
            ? 'bg-primary/10 text-primary'
            : planUpper === 'ULTRA'
              ? 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary'
              : 'bg-muted text-muted-foreground';

    return (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-2.5 shadow-sm">
            <Link
                href={ROUTES.DASHBOARD_CREDITS}
                className="flex items-center gap-1.5 transition-colors duration-150 hover:text-primary"
            >
                <Diamond size={16} weight="fill" className="text-primary" />
                <span className={cn('text-sm font-medium', creditColor)}>
                    {data.credits}
                </span>
            </Link>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Camera size={16} />
                <span>{data.totalPhotos}</span>
                <span>{t('dashboard.stats_photos')}</span>
            </div>

            <div className="h-4 w-px bg-border" />

            <span
                className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    planClasses,
                )}
            >
                {data.plan}
            </span>

            <div className="flex-1" />

            <Button size="sm" asChild>
                <Link href={ROUTES.CREATE} className="gap-1.5">
                    <Plus size={16} weight="bold" />
                    {t('dashboard.new_photo')}
                </Link>
            </Button>
        </div>
    );
}
