'use client';

import React from 'react';
import { Eye, EyeSlash, Trash, Images } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { GalleryImagePicker } from './GalleryImagePicker';
import { getServerImageUrl } from '@/lib/utils/image';
import type { PortfolioItem, PortfolioItemFormData } from '../types/portfolio.types';
import type { JobResultImage } from '../types/builder.types';

interface GallerySectionProps {
    items: PortfolioItem[];
    jobResults: JobResultImage[];
    portfolioImageUrls: Set<string>;
    isResultsLoading: boolean;
    onAdd: (data: PortfolioItemFormData) => Promise<void>;
    onUpdate: (params: { id: string; data: Partial<PortfolioItemFormData> }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function GallerySection({
    items,
    jobResults,
    portfolioImageUrls,
    isResultsLoading,
    onAdd,
    onUpdate,
    onDelete,
}: GallerySectionProps): React.ReactElement {
    const { t } = useLanguage();
    const publishedCount = items.filter((i) => i.isPublished).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">{t('portfolio.nav_gallery')}</h2>
                <p className="text-sm text-muted-foreground">
                    {items.length > 0
                        ? `${publishedCount} ${t('portfolio.gallery_published')} · ${items.length} ${t('portfolio.gallery_total')}`
                        : t('portfolio.gallery_empty')}
                </p>
            </div>

            {/* Current portfolio items */}
            {items.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('portfolio.your_portfolio')}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    'group relative overflow-hidden rounded-xl border transition-all duration-200',
                                    item.isPublished
                                        ? 'border-border/50'
                                        : 'border-dashed border-border/60 opacity-60'
                                )}
                            >
                                <div className="aspect-[3/4]">
                                    <img
                                        src={getServerImageUrl(item.imageUrl)}
                                        alt={item.title ?? t('portfolio.your_portfolio')}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Overlay with actions */}
                                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <div className="flex w-full items-center justify-between p-2">
                                        <p className="truncate text-xs font-medium text-white">
                                            {item.title ?? ''}
                                        </p>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onUpdate({ id: item.id, data: { isPublished: !item.isPublished } })}
                                                className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                                                aria-label={item.isPublished ? t('portfolio.hide_portfolio') : t('portfolio.show_portfolio')}
                                            >
                                                {item.isPublished ? <Eye size={14} /> : <EyeSlash size={14} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(item.id)}
                                                className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-destructive/80"
                                                aria-label={t('portfolio.remove_portfolio')}
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Hidden badge */}
                                {!item.isPublished && (
                                    <div className="absolute left-2 top-2">
                                        <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                                            {t('ui.text_kbpmio')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Divider */}
            {items.length > 0 && <div className="h-px bg-border/50" />}

            {/* Add from your work */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Images size={16} className="text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('portfolio.add_from_work')}
                    </p>
                </div>

                {isResultsLoading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                        ))}
                    </div>
                ) : jobResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12 text-center">
                        <Images size={32} className="mb-2 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">{t('portfolio.no_photos')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('portfolio.no_photos_desc')}
                        </p>
                    </div>
                ) : (
                    <GalleryImagePicker
                        jobResults={jobResults}
                        portfolioImageUrls={portfolioImageUrls}
                        onAdd={onAdd}
                    />
                )}
            </div>
        </div>
    );
}
