'use client';

import { ArrowClockwise, Sparkle, CircleNotch } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDecorationPoolStatus, useReplenishDecorationPool } from '../hooks/useAdmin';

const POOL_TARGET = 50;

const NICHE_LABELS: Record<string, string> = {
    hair: 'Hair',
    eyes: 'Eyes',
    lips: 'Lips',
    nails: 'Nails',
    skin: 'Skin',
    general: 'General',
};

export function AdminDecorationPool(): React.ReactElement {
    const { t } = useLanguage();
    const { pool, isLoading, refetch } = useDecorationPoolStatus();
    const { replenish, isPending } = useReplenishDecorationPool();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
                            <Skeleton className="mb-2 h-4 w-16" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const counts = pool?.counts ?? [];
    const totalSuggestions = counts.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkle size={18} weight="fill" className="text-primary" />
                    <h2 className="text-lg font-semibold tracking-tight">
                        {t('admin.decoration_pool_title')}
                    </h2>
                    <span className="text-sm text-muted-foreground tabular-nums">
                        ({totalSuggestions} {t('admin.decoration_pool_total')})
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                            'text-xs font-medium',
                            'border border-border/50 bg-card text-foreground',
                            'hover:bg-muted transition-all duration-150 active:scale-[0.97]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        )}
                    >
                        <ArrowClockwise size={14} />
                        {t('admin.decoration_pool_refresh')}
                    </button>
                    <button
                        type="button"
                        onClick={() => replenish()}
                        disabled={isPending}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                            'text-xs font-medium',
                            'bg-primary text-primary-foreground',
                            'hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            'disabled:opacity-50 disabled:cursor-wait',
                        )}
                    >
                        {isPending ? (
                            <CircleNotch size={14} className="animate-spin" />
                        ) : (
                            <Sparkle size={14} weight="fill" />
                        )}
                        {isPending
                            ? t('admin.decoration_pool_replenishing')
                            : t('admin.decoration_pool_replenish')
                        }
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {counts.map((item) => {
                    const percentage = Math.round((item.count / POOL_TARGET) * 100);
                    const isLow = item.count < 6;
                    const isFull = item.count >= POOL_TARGET;

                    return (
                        <div
                            key={item.niche}
                            className={cn(
                                'rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
                                isLow
                                    ? 'border-destructive/30'
                                    : isFull
                                      ? 'border-success/30'
                                      : 'border-border/50',
                            )}
                        >
                            <p className="text-sm text-muted-foreground">
                                {NICHE_LABELS[item.niche] ?? item.niche}
                            </p>
                            <p className={cn(
                                'mt-1 text-2xl font-semibold tabular-nums tracking-tight',
                                isLow && 'text-destructive',
                                isFull && 'text-success',
                            )}>
                                {item.count}
                            </p>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                                <div
                                    className={cn(
                                        'h-1.5 rounded-full transition-all duration-500',
                                        isLow
                                            ? 'bg-destructive'
                                            : isFull
                                              ? 'bg-success'
                                              : 'bg-primary',
                                    )}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground/60 tabular-nums">
                                {percentage}% of {POOL_TARGET}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
