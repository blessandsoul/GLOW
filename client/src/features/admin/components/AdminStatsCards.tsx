'use client';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminStats } from '../types/admin.types';

interface AdminStatsCardsProps {
    stats: AdminStats | undefined;
    isLoading: boolean;
}

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps): React.ReactElement {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return <></>;

    const cards = [
        { label: t('admin.stat_users'), value: stats.totalUsers },
        { label: t('admin.stat_jobs'), value: stats.totalJobs },
        { label: t('admin.stat_captions'), value: stats.totalCaptions },
        {
            label: t('admin.stat_subscriptions'),
            value: Object.values(stats.activeSubscriptions).reduce((a, b) => a + b, 0),
            breakdown: stats.activeSubscriptions,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                        {card.value.toLocaleString()}
                    </p>
                    {card.breakdown && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(card.breakdown).map(([plan, count]) => (
                                <span
                                    key={plan}
                                    className="text-xs text-muted-foreground"
                                >
                                    {plan}: <span className="font-medium text-foreground tabular-nums">{count}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
