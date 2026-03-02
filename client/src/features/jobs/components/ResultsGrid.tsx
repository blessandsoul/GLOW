'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
    DownloadSimple, Sparkle, WarningCircle,
    LinkSimple, Stamp, MagnifyingGlassPlus,
    SlidersHorizontal, GridFour, ArrowsOut,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CaptionGenerator } from '@/features/captions/components/CaptionGenerator';
import { WatermarkOverlay } from '@/features/branding/components/WatermarkPreview';
import { useBranding } from '@/features/branding/hooks/useBranding';
import { AddToPortfolioButton } from '@/features/portfolio/components/AddToPortfolioButton';
import { ImageLightbox } from '@/features/portfolio/components/ImageLightbox';
import { ImageCompare } from '@/components/ui/ImageCompare';
import type { Job } from '../types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { getServerImageUrl } from '@/lib/utils/image';

interface ResultsGridProps {
    job: Job;
    isAuthenticated: boolean;
    onDownload: (url: string, jobId: string, variantIndex: number, branded?: boolean, upscale?: boolean) => void;
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

// ─── Main ResultsGrid ─────────────────────────────────────────────────────────
export function ResultsGrid({ job, isAuthenticated, onDownload, onRetouch }: ResultsGridProps): React.ReactElement {
    const { t } = useLanguage();
    const { profile: brandingProfile } = useBranding();

    const hasBranding = !!(isAuthenticated && brandingProfile?.isActive &&
        brandingProfile.displayName && brandingProfile.instagramHandle);

    const [showBranding, setShowBranding] = useState(false);
    const [selectedAfterIdx, setSelectedAfterIdx] = useState(0);
    const [compareMode, setCompareMode] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
    const [isUpscaling, setIsUpscaling] = useState(false);

    const openLightbox = useCallback((index: number) => {
        setLightboxInitialIndex(index);
        setLightboxOpen(true);
    }, []);

    const results = job.results ?? [];

    const handleHDDownload = useCallback(async () => {
        setIsUpscaling(true);
        try {
            await onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, false, true);
        } catch {
            toast.error(t('ui.download_hd_failed'));
        } finally {
            setIsUpscaling(false);
        }
    }, [onDownload, results, selectedAfterIdx, job.id, t]);

    // Build lightbox images array: [Before, After]
    // NOTE: This useMemo MUST be before any early returns to maintain consistent hook ordering
    const lightboxImages = React.useMemo(() => {
        if (!job.originalUrl || results.length === 0) return [];
        return [
            { imageUrl: job.originalUrl, title: t('ui.text_pt6') },
            { imageUrl: results[selectedAfterIdx] ?? results[0], title: t('ui.text_gnzjzw') },
        ];
    }, [job.originalUrl, results, selectedAfterIdx, t]);

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

    const brandingVisible = hasBranding && showBranding;

    return (
        <div className="flex w-full flex-col gap-3 py-2">
            {/* Branding toggle */}
            {hasBranding && (
                <div className="flex items-center justify-end">
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
                </div>
            )}

            {/* Before / After comparison — prominent, full-width on mobile */}
            {results.length > 0 && job.originalUrl && (
                <div className="flex flex-col gap-2">
                    {/* View mode toggle: Grid vs Slider */}
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">
                            {t('ui.text_668ns3')}
                        </span>
                        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5">
                            <button
                                type="button"
                                onClick={() => setCompareMode(false)}
                                className={cn(
                                    'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all duration-200',
                                    !compareMode
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                                aria-label={t('ui.text_pt6') + ' / ' + t('ui.text_gnzjzw')}
                            >
                                <GridFour size={12} weight={!compareMode ? 'fill' : 'regular'} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCompareMode(true)}
                                className={cn(
                                    'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all duration-200',
                                    compareMode
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                                aria-label={t('ui.compare_slider')}
                            >
                                <SlidersHorizontal size={12} weight={compareMode ? 'fill' : 'regular'} />
                            </button>
                        </div>
                    </div>

                    {compareMode ? (
                        /* ── Slider comparison view ── */
                        <div className="overflow-hidden rounded-xl border border-border/50">
                            <ImageCompare
                                beforeSrc={getServerImageUrl(job.originalUrl)}
                                afterSrc={getServerImageUrl(results[selectedAfterIdx] ?? results[0])}
                                beforeAlt={t('ui.text_pt6')}
                                afterAlt={t('ui.text_gnzjzw')}
                                className="aspect-3/4 w-full"
                                initialPosition={50}
                                beforeScale={1.30}
                            />
                            <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
                                <span className="text-[10px] font-semibold text-muted-foreground">{t('ui.text_pt6')}</span>
                                <span className="text-[10px] text-muted-foreground">{t('ui.compare_slider_hint')}</span>
                                <span className="text-[10px] font-semibold text-muted-foreground">{t('ui.text_gnzjzw')}</span>
                            </div>
                        </div>
                    ) : (
                        /* ── Side-by-side grid view ── */
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
                                        className="scale-[1.30] object-cover transition-transform duration-300 group-hover:scale-[1.32]"
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
                                onClick={() => openLightbox(1)}
                                className={cn(
                                    'group relative overflow-hidden rounded-xl border border-primary/30 ring-1 ring-primary/20',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                )}
                            >
                                <div className="relative aspect-3/4">
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
                                    <MagnifyingGlassPlus size={14} className="text-white/60" />
                                </div>
                            </button>
                        </div>
                    )}

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

            {/* Quick action row */}
            {results.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {/* HD upscaling loading state */}
                    {isUpscaling && (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                            <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground">{t('ui.download_hd_preparing')}</p>
                                <p className="text-[11px] text-muted-foreground">{t('ui.upscaling')}</p>
                            </div>
                        </div>
                    )}

                    {hasBranding && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5 text-xs h-9"
                            disabled={isUpscaling}
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
                        disabled={isUpscaling}
                        onClick={() => onDownload(results[selectedAfterIdx] ?? results[0], job.id, selectedAfterIdx, false)}
                    >
                        <DownloadSimple size={13} />
                        {t('ui.download_btn')}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 text-xs h-9"
                        onClick={handleHDDownload}
                        disabled={isUpscaling}
                    >
                        <ArrowsOut size={13} />
                        {t('ui.download_hd')}
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
