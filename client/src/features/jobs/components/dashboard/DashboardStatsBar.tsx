'use client';

import Link from 'next/link';
import { Diamond, Camera, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';

export function DashboardStatsBar(): React.ReactElement {
    const { t } = useLanguage();
    const { data, isLoading, isError } = useDashboardStats();

    if (isLoading && !data) {
        return <Skeleton className="h-11 rounded-xl" />;
    }

    if (isError || !data) {
        return null;
    }

    const creditColor =
        data.credits <= 3
            ? 'text-destructive'
            : data.credits <= 10
              ? 'text-warning'
              : 'text-foreground';

    return (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm">
            {IS_LAUNCH_MODE ? (
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Diamond size={16} weight="fill" className="text-primary shrink-0" />
                    <span className={cn('text-sm font-medium tabular-nums', creditColor)}>
                        {data.credits}/{data.dailyUsage?.limit ?? 5} {t('dashboard.stats_today')}
                    </span>
                </div>
            ) : (
                <Link
                    href={ROUTES.DASHBOARD_CREDITS}
                    className="flex items-center gap-1.5 whitespace-nowrap transition-colors duration-150 hover:text-primary"
                >
                    <Diamond size={16} weight="fill" className="text-primary shrink-0" />
                    <span className={cn('text-sm font-medium', creditColor)}>
                        {data.credits}
                    </span>
                </Link>
            )}

            <div className="h-4 w-px shrink-0 bg-border" />

            <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
                <Camera size={16} className="shrink-0" />
                <span>{data.totalPhotos} {t('dashboard.stats_photos')}</span>
            </div>

            <div className="flex-1 min-w-0" />

            <Button size="sm" className="min-h-[36px] shrink-0" asChild>
                <Link href={ROUTES.CREATE} className="gap-1.5">
                    <Plus size={16} weight="bold" />
                    <span className="hidden sm:inline">{t('dashboard.new_photo')}</span>
                </Link>
            </Button>
        </div>
    );
}
