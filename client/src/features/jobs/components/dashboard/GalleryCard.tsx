'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import {
    SpinnerGap,
    WarningCircle,
    DownloadSimple,
    Trash,
    Check,
    CheckCircle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getServerImageUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { Job } from '../../types/job.types';

interface GalleryCardProps {
    job: Job;
    isSelecting: boolean;
    isSelected: boolean;
    isInPortfolio?: boolean;
    onSelect: () => void;
    onClick: () => void;
    onDelete: () => void;
    onDownload: () => void;
}

function GalleryCardInner({
    job,
    isSelecting,
    isSelected,
    isInPortfolio,
    onSelect,
    onClick,
    onDelete,
    onDownload,
}: GalleryCardProps): React.ReactElement {
    const { t } = useLanguage();
    const isDone = job.status === 'DONE';
    const isProcessing = job.status === 'PROCESSING' || job.status === 'PENDING';
    const isFailed = job.status === 'FAILED';

    const imageSrc =
        isDone && job.results && job.results.length > 0
            ? getServerImageUrl(job.results[0])
            : getServerImageUrl(job.originalUrl);

    const resultCount = job.results?.length ?? 0;
    const dateLabel = new Date(job.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

    const handleClick = useCallback((): void => {
        if (isSelecting) {
            onSelect();
        } else {
            onClick();
        }
    }, [isSelecting, onSelect, onClick]);

    const stopAndCall = useCallback(
        (handler: () => void) => (e: React.MouseEvent): void => {
            e.stopPropagation();
            handler();
        },
        [],
    );

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClick();
            }}
            className={cn(
                'relative aspect-[3/4] overflow-hidden rounded-xl group cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isSelected && 'ring-2 ring-primary ring-offset-2',
            )}
        >
            <Image
                src={imageSrc}
                alt={`Job ${job.id}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
            />

            {/* Status overlay for non-DONE jobs */}
            {!isDone && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    {isProcessing && (
                        <div className="flex flex-col items-center gap-1.5">
                            <SpinnerGap
                                size={28}
                                className="motion-safe:animate-spin text-white"
                            />
                            <span className="text-xs font-medium text-white/80">
                                {t('dashboard.processing')}
                            </span>
                        </div>
                    )}
                    {isFailed && (
                        <div className="flex flex-col items-center gap-1.5">
                            <WarningCircle size={28} className="text-destructive" />
                            <span className="text-xs font-medium text-destructive">
                                {t('dashboard.failed')}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom gradient with info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8">
                <div className="flex items-end justify-between">
                    <span className="text-xs text-white/80">{dateLabel}</span>
                    {resultCount > 0 && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                            {resultCount} {t('dashboard.results_count')}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover overlay with action buttons (DONE jobs, desktop) */}
            {isDone && (
                <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
                    <button
                        type="button"
                        onClick={stopAndCall(onDownload)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/30"
                        aria-label={t('dashboard.delete_btn')}
                    >
                        <DownloadSimple size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={stopAndCall(onDelete)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/20 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-destructive/30"
                        aria-label={t('dashboard.delete_btn')}
                    >
                        <Trash size={18} />
                    </button>
                </div>
            )}

            {/* Portfolio badge */}
            {isInPortfolio && isDone && !isSelecting && (
                <div className="absolute right-2.5 top-2.5 z-10">
                    <span className="flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        <CheckCircle size={10} weight="fill" />
                        {t('portfolio.in_portfolio')}
                    </span>
                </div>
            )}

            {/* Selection checkbox */}
            {isSelecting && (
                <div className="absolute left-2.5 top-2.5 z-10">
                    <button
                        type="button"
                        onClick={stopAndCall(onSelect)}
                        className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-150',
                            isSelected
                                ? 'border-primary bg-primary'
                                : 'border-white/60 bg-black/20 backdrop-blur-sm',
                        )}
                    >
                        {isSelected && <Check size={14} weight="bold" className="text-primary-foreground" />}
                    </button>
                </div>
            )}
        </div>
    );
}

export const GalleryCard = React.memo(GalleryCardInner);
