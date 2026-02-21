'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TrendUp, Lock, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCurrentTrends, useArchiveTrends } from '../hooks/useTrends';
import type { TrendTemplate } from '../types/trend.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

function TrendCard({
    trend,
    onSelect,
}: {
    trend: TrendTemplate;
    onSelect: (trend: TrendTemplate) => void;
}): React.ReactElement {
    const { t } = useLanguage();
    return (
        <div
            className={cn(
                'group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md',
                trend.isFree ? 'border-border/50' : 'border-primary/30'
            )}
            onClick={() => onSelect(trend)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(trend);
                }
            }}
        >
            <div className="relative aspect-4/5 overflow-hidden">
                <Image
                    src={trend.previewUrl}
                    alt={trend.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                />

                {/* Free/Pro badge */}
                <div className="absolute left-2 top-2">
                    {trend.isFree ? (
                        <span className="rounded-full bg-success/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                            Free
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                            <Lock size={10} />
                            Pro
                        </span>
                    )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="w-full p-3">
                        <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
                            <Sparkle size={12} />
                            {t('ui.text_ad3705')}</Button>
                    </div>
                </div>
            </div>

            <div className="p-3">
                <p className="text-sm font-semibold text-foreground">{trend.title}</p>
                {trend.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {t(trend.description)}
                    </p>
                )}
            </div>
        </div>
    );
}

export function TrendTemplatesPanel(): React.ReactElement {
    const { t } = useLanguage();
    const { trends: current, isLoading: isLoadingCurrent } = useCurrentTrends();
    const { trends: archive, isLoading: isLoadingArchive } = useArchiveTrends();
    const [tab, setTab] = useState<'current' | 'archive'>('current');

    const handleSelect = (trend: TrendTemplate): void => {
        // TODO: Apply trend settings to upload
        void trend;
    };

    const isLoading = tab === 'current' ? isLoadingCurrent : isLoadingArchive;
    const trends = tab === 'current' ? current : archive;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                    <TrendUp size={24} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">{t('ui.text_si44k9')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('ui.text_z1iso2')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                <button
                    type="button"
                    onClick={() => setTab('current')}
                    className={cn(
                        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === 'current'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {t('ui.text_wvkp9u')}</button>
                <button
                    type="button"
                    onClick={() => setTab('archive')}
                    className={cn(
                        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === 'archive'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {t('ui.text_gfrzyn')}</button>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-4/5 rounded-xl" />
                    ))}
                </div>
            ) : trends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 py-12 text-center">
                    <p className="text-sm text-muted-foreground">{t('ui.text_oxd50b')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {trends.map((trend) => (
                        <TrendCard
                            key={trend.id}
                            trend={trend}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
