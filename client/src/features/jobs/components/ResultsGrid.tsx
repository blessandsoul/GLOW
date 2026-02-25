'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    DownloadSimple, Sparkle, WarningCircle, ShareNetwork, Lock,
    Eraser, LinkSimple, Flask, Stamp,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { GuestResultBanner } from '@/features/upload/components/GuestResultBanner';
import { CaptionGenerator } from '@/features/captions/components/CaptionGenerator';
import { WatermarkOverlay } from '@/features/branding/components/WatermarkPreview';
import { useBranding } from '@/features/branding/hooks/useBranding';
import { AddToPortfolioButton } from '@/features/portfolio/components/AddToPortfolioButton';
import type { Job } from '../types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { getServerImageUrl } from '@/lib/utils/image';

interface ResultsGridProps {
    job: Job;
    isAuthenticated: boolean;
    isGuest?: boolean;
    isDemo?: boolean;
    onDownload: (url: string, jobId: string, variantIndex: number, branded: boolean) => void;
    onRetouch?: (url: string) => void;
}

// ─── Share link helper ────────────────────────────────────────────────────────
function ShareButton({ jobId }: { jobId: string }): React.ReactElement {
    const handleCopyLink = async (): Promise<void> => {
        const showcaseUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/showcase/${jobId}`
            : `/showcase/${jobId}`;
        try {
            await navigator.clipboard.writeText(showcaseUrl);
            toast.success('ლინკი დაკოპირდა');
        } catch {
            toast.error('ვერ მოხერხდა კოპირება');
        }
    };

    return (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
            <LinkSimple size={14} />
            გაზიარება
        </Button>
    );
}

// ─── Demo banner ──────────────────────────────────────────────────────────────
function DemoBanner(): React.ReactElement {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3.5 dark:border-amber-800/40 dark:bg-amber-950/30">
            <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/40">
                <Flask size={14} className="text-amber-600 dark:text-amber-400" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    შედეგების მაგალითი
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-400/80">
                    ეს დემო-ვარიანტია. რეგისტრაციის შემდეგ AI დაამუშავებს შენს ფოტოს და მიიღებ პროფესიულ შედეგს.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-amber-700"
                    >
                        რეგისტრაცია
                    </Link>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 px-2.5 py-1 text-[11px] text-amber-700 dark:border-amber-800 dark:text-amber-400">
                        <Sparkle size={10} weight="fill" />
                        1 კრედიტი = 1 ფოტო
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Main ResultsGrid ─────────────────────────────────────────────────────────
export function ResultsGrid({ job, isAuthenticated, isGuest, isDemo, onDownload, onRetouch }: ResultsGridProps): React.ReactElement {
    const { t } = useLanguage();
    const { profile: brandingProfile } = useBranding();

    const hasBranding = !!(isAuthenticated && !isDemo && brandingProfile?.isActive &&
        brandingProfile.displayName && brandingProfile.instagramHandle);

    const [showBranding, setShowBranding] = useState(false);
    const [selectedAfterIdx, setSelectedAfterIdx] = useState(0);

    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
        return (
            <div className="flex w-full flex-col items-center gap-6 py-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Sparkle size={32} className="animate-pulse text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-base font-semibold text-foreground">{t('ui.text_c0yn6g')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_wyqnkc')}</p>
                    </div>
                </div>
                <div className="flex w-full max-w-sm justify-center">
                    <Skeleton className="aspect-3/4 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (job.status === 'FAILED') {
        return (
            <div className="flex w-full flex-col items-center gap-4 py-12">
                <div className="rounded-full bg-destructive/10 p-4">
                    <WarningCircle size={32} className="text-destructive" />
                </div>
                <div className="text-center">
                    <p className="text-base font-semibold text-foreground">{t('ui.text_y81efi')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_6hw7ec')}</p>
                </div>
            </div>
        );
    }

    const results = job.results ?? [];
    const brandingVisible = hasBranding && showBranding;

    const handleShare = async (url: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success(t('ui.text_fj1r2r'));
        } catch {
            toast.error(t('ui.text_h1ne34'));
        }
    };

    return (
        <div className="flex w-full flex-col gap-5 py-4">
            {isDemo && <DemoBanner />}
            {isGuest && !isDemo && <GuestResultBanner jobId={job.id} />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-base font-semibold text-foreground">
                        {isDemo ? 'შედეგების მაგალითი' : t('ui.text_k25oyf')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {isDemo
                            ? 'ასე გამოიყურება დამუშავებული ფოტო — შენი კიდევ უკეთესი იქნება'
                            : `${results.length} ${t('ui.text_mhnuxr')}${results.length > 1 ? t('ui.text_ts') : ''} ${t('ui.text_tfd6xc')}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Branding toggle — prominent pill */}
                    {hasBranding && (
                        <button
                            type="button"
                            onClick={() => setShowBranding((v) => !v)}
                            className={cn(
                                'flex items-center gap-2 rounded-xl border-2 px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-[0.97]',
                                showBranding
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                            )}
                            aria-label={showBranding ? 'Hide branding' : 'Show branding'}
                        >
                            <Stamp size={14} weight={showBranding ? 'fill' : 'regular'} />
                            {showBranding ? 'Branded' : 'Add branding'}
                        </button>
                    )}
                    {!isAuthenticated && !isGuest && (
                        <Button size="sm" className="gap-1.5 text-xs" asChild>
                            <Link href="/register">
                                <Lock size={12} />
                                {t('ui.text_l7x1oj')}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Before / After side-by-side comparison */}
            {results.length > 0 && job.originalUrl && (
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Before (Original) */}
                        <div className="relative overflow-hidden rounded-xl border border-border/50">
                            <div className="relative aspect-3/4">
                                <Image
                                    src={getServerImageUrl(job.originalUrl)}
                                    alt={t('ui.text_pt6')}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 40vw"
                                    unoptimized
                                />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
                                <span className="text-xs font-semibold text-white/90">{t('ui.text_pt6')}</span>
                            </div>
                        </div>

                        {/* After (Result) */}
                        <div className="group relative overflow-hidden rounded-xl border border-primary/30 ring-2 ring-primary/15">
                            <div className={cn('relative aspect-3/4', (!isAuthenticated || isDemo) && 'blur-sm')}>
                                <Image
                                    src={getServerImageUrl(results[selectedAfterIdx] ?? results[0])}
                                    alt={t('ui.text_gnzjzw')}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 40vw"
                                    unoptimized
                                />
                                {/* Branding overlay */}
                                {brandingVisible && brandingProfile && (
                                    <WatermarkOverlay
                                        style={brandingProfile.watermarkStyle}
                                        color={brandingProfile.primaryColor}
                                        name={brandingProfile.displayName ?? ''}
                                        handle={brandingProfile.instagramHandle ?? ''}
                                        logoUrl={brandingProfile.logoUrl ? getServerImageUrl(brandingProfile.logoUrl) : null}
                                        opacity={brandingProfile.watermarkOpacity}
                                    />
                                )}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
                                <span className="text-xs font-semibold text-white/90">{t('ui.text_gnzjzw')}</span>
                                {isAuthenticated && !isDemo && (
                                    <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                        {onRetouch && (
                                            <button
                                                type="button"
                                                onClick={() => onRetouch(results[selectedAfterIdx] ?? results[0])}
                                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                                aria-label={t('ui.text_jry5cq')}
                                            >
                                                <Eraser size={12} className="text-white" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleShare(results[selectedAfterIdx] ?? results[0])}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                            aria-label={t('ui.text_nq6g7p')}
                                        >
                                            <ShareNetwork size={12} className="text-white" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, brandingVisible)}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/40"
                                            aria-label={t('ui.text_9ftpjq')}
                                        >
                                            <DownloadSimple size={12} className="text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {(!isAuthenticated || isDemo) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="rounded-full bg-background/80 p-2 shadow-sm backdrop-blur-sm">
                                        <Lock size={16} className="text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variant thumbnails — only when multiple results */}
                    {results.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground shrink-0">{t('ui.text_tfd6xc')}:</span>
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {results.map((url, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedAfterIdx(i)}
                                        className={cn(
                                            'relative h-12 w-9 shrink-0 overflow-hidden rounded-md border transition-all duration-150',
                                            selectedAfterIdx === i
                                                ? 'border-primary ring-1 ring-primary/30'
                                                : 'border-border/40 hover:border-border',
                                        )}
                                    >
                                        <Image
                                            src={getServerImageUrl(url)}
                                            alt={`#${i + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="36px"
                                            unoptimized
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fallback grid for demo/guest (no originalUrl) */}
            {results.length > 0 && !job.originalUrl && (
                <div className={cn(
                    results.length === 1
                        ? 'flex justify-center'
                        : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
                )}>
                    {results.map((url, i) => (
                        <div
                            key={i}
                            className={cn(
                                'group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer',
                                results.length === 1 && 'w-full max-w-sm',
                                selectedAfterIdx === i && isAuthenticated && !isDemo
                                    ? 'border-primary/50 ring-2 ring-primary/20'
                                    : 'border-border/50',
                            )}
                            onClick={() => setSelectedAfterIdx(i)}
                        >
                            <div className={cn('relative aspect-3/4', (!isAuthenticated || isDemo) && 'blur-sm')}>
                                <Image
                                    src={getServerImageUrl(url)}
                                    alt={`Вариант ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 25vw"
                                    unoptimized
                                />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-8">
                                <span className="text-xs font-medium text-white/80">
                                    {isDemo ? 'Demo' : `#${i + 1}`}
                                </span>
                            </div>
                            {(!isAuthenticated || isDemo) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="rounded-full bg-background/80 p-2 shadow-sm backdrop-blur-sm">
                                        <Lock size={16} className="text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions — authenticated users only */}
            {isAuthenticated && !isDemo && results.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {hasBranding && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, true)}
                            >
                                <Stamp size={14} weight="fill" />
                                ბრენდით
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, false)}
                        >
                            <DownloadSimple size={14} />
                            ჩამოტვირთვა
                        </Button>
                        <ShareButton jobId={job.id} />
                        <AddToPortfolioButton
                            jobId={job.id}
                            imageUrl={results[selectedAfterIdx] ?? results[0]}
                        />
                        <CaptionGenerator jobId={job.id} />
                    </div>
                </div>
            )}
        </div>
    );
}
