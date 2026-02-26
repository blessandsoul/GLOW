'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    DownloadSimple, Sparkle, WarningCircle, Lock,
    LinkSimple, Flask, Stamp, MagnifyingGlassPlus,
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
import { ImageLightbox } from '@/features/portfolio/components/ImageLightbox';
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
    const { t } = useLanguage();

    const handleCopyLink = async (): Promise<void> => {
        const showcaseUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/showcase/${jobId}`
            : `/showcase/${jobId}`;
        try {
            await navigator.clipboard.writeText(showcaseUrl);
            toast.success(t('ui.share_link_copied'));
        } catch {
            toast.error(t('ui.share_copy_failed'));
        }
    };

    return (
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-9" onClick={handleCopyLink}>
            <LinkSimple size={14} />
            {t('ui.share_btn')}
        </Button>
    );
}

// ─── Demo banner ──────────────────────────────────────────────────────────────
function DemoBanner(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3.5 dark:border-amber-800/40 dark:bg-amber-950/30">
            <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/40">
                <Flask size={14} className="text-amber-600 dark:text-amber-400" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    {t('ui.demo_title')}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-400/80">
                    {t('ui.demo_desc')}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-amber-700"
                    >
                        {t('ui.demo_register')}
                    </Link>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 px-2.5 py-1 text-[11px] text-amber-700 dark:border-amber-800 dark:text-amber-400">
                        <Sparkle size={10} weight="fill" />
                        {t('ui.demo_credit_info')}
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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setLightboxInitialIndex(index);
        setLightboxOpen(true);
    }, []);

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

    // Build lightbox images array: [Before, After]
    const lightboxImages = React.useMemo(() => {
        if (!job.originalUrl || results.length === 0) return [];
        return [
            { imageUrl: job.originalUrl, title: t('ui.text_pt6') },
            { imageUrl: results[selectedAfterIdx] ?? results[0], title: t('ui.text_gnzjzw') },
        ];
    }, [job.originalUrl, results, selectedAfterIdx, t]);

    return (
        <div className="flex w-full flex-col gap-3 py-2">
            {isDemo && <DemoBanner />}
            {isGuest && !isDemo && <GuestResultBanner jobId={job.id} />}

            {/* Compact header */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                    {isDemo ? t('ui.demo_title') : t('ui.text_k25oyf')}
                </p>
                <div className="flex items-center gap-2">
                    {hasBranding && (
                        <button
                            type="button"
                            onClick={() => setShowBranding((v) => !v)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 active:scale-[0.97]',
                                showBranding
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                            )}
                            aria-label={showBranding ? t('ui.hide_branding') : t('ui.show_branding')}
                        >
                            <Stamp size={12} weight={showBranding ? 'fill' : 'regular'} />
                            {showBranding ? t('ui.branded') : t('ui.add_branding')}
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

            {/* Before / After comparison — prominent, full-width on mobile */}
            {results.length > 0 && job.originalUrl && (
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1.5">
                        {/* Before (Original) */}
                        <button
                            type="button"
                            onClick={() => openLightbox(0)}
                            className="group relative overflow-hidden rounded-xl border border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <div className="relative aspect-3/4">
                                <Image
                                    src={getServerImageUrl(job.originalUrl)}
                                    alt={t('ui.text_pt6')}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    sizes="(max-width: 640px) 50vw, 40vw"
                                    unoptimized
                                />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 to-transparent px-2.5 pb-2 pt-8">
                                <span className="text-[11px] font-semibold text-white/90">{t('ui.text_pt6')}</span>
                                <MagnifyingGlassPlus size={14} className="text-white/60" />
                            </div>
                        </button>

                        {/* After (Result) */}
                        <button
                            type="button"
                            onClick={() => isAuthenticated && !isDemo ? openLightbox(1) : undefined}
                            className={cn(
                                'group relative overflow-hidden rounded-xl border border-primary/30 ring-1 ring-primary/20',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                (!isAuthenticated || isDemo) && 'cursor-default',
                            )}
                        >
                            <div className={cn('relative aspect-3/4', (!isAuthenticated || isDemo) && 'blur-sm')}>
                                <Image
                                    src={getServerImageUrl(results[selectedAfterIdx] ?? results[0])}
                                    alt={t('ui.text_gnzjzw')}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    sizes="(max-width: 640px) 50vw, 40vw"
                                    unoptimized
                                />
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
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 to-transparent px-2.5 pb-2 pt-8">
                                <span className="text-[11px] font-semibold text-white/90">{t('ui.text_gnzjzw')}</span>
                                {isAuthenticated && !isDemo && (
                                    <MagnifyingGlassPlus size={14} className="text-white/60" />
                                )}
                            </div>
                            {(!isAuthenticated || isDemo) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="rounded-full bg-background/80 p-2 shadow-sm backdrop-blur-sm">
                                        <Lock size={16} className="text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </button>
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
                        : 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4',
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
                                    alt={`#${i + 1}`}
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

            {/* Quick action row — always visible on mobile */}
            {isAuthenticated && !isDemo && results.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {hasBranding && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5 text-xs h-9"
                            onClick={() => onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, true)}
                        >
                            <Stamp size={13} weight="fill" />
                            {t('ui.download_branded')}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 text-xs h-9"
                        onClick={() => onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, false)}
                    >
                        <DownloadSimple size={13} />
                        {t('ui.download_btn')}
                    </Button>
                    <ShareButton jobId={job.id} />
                    <AddToPortfolioButton
                        jobId={job.id}
                        imageUrl={results[selectedAfterIdx] ?? results[0]}
                    />
                    <CaptionGenerator jobId={job.id} />
                </div>
            )}

            {/* Fullscreen before/after lightbox */}
            {lightboxImages.length > 0 && (
                <ImageLightbox
                    images={lightboxImages}
                    initialIndex={lightboxInitialIndex}
                    open={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </div>
    );
}
