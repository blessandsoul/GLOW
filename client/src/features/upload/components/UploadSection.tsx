'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    MagicWand, Package, ArrowsLeftRight, ArrowLeft, ArrowCounterClockwise,
    Sparkle, Stack, Lock, ArrowRight, Camera,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { UploadZone } from './UploadZone';
import { ProductAdPanel } from './ProductAdPanel';
import type { ProductAdSettings } from './ProductAdPanel';
import { GuestResultBanner } from './GuestResultBanner';
import { ResultsGrid } from '@/features/jobs/components/ResultsGrid';
import { BeforeAfterUpload } from '@/features/before-after/components/BeforeAfterUpload';
import { BeforeAfterResults } from '@/features/before-after/components/BeforeAfterResults';
import { BatchUploadZone } from './BatchUploadZone';
import { useUpload } from '../hooks/useUpload';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { useBeforeAfter } from '@/features/before-after/hooks/useBeforeAfter';

import { getErrorMessage } from '@/lib/utils/error';
import type { RootState } from '@/store';
import type { PhotoSettings, ProcessingType } from '../types/upload.types';
import { DEFAULT_SETTINGS } from '../types/upload.types';
import { useCreditsBalance } from '@/features/credits/hooks/useCredits';
import { useCurrentTrends } from '@/features/trends/hooks/useTrends';
import { StoriesGenerator } from '@/features/stories/components/StoriesGenerator';
import { RetouchPanel } from '@/features/retouch/components/RetouchPanel';
import { StylesGallery } from '@/features/filters/components/StylesGallery';
import type { Style, FilterStyle } from '@/features/filters/types/styles.types';
import type { AppMode } from '../types/presets.types';
import type { Job, BatchCreateResult } from '@/features/jobs/types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

const MODE_CONFIG: { id: AppMode; icon: typeof MagicWand; labelKey: string; locked?: boolean }[] = [
    { id: 'beauty', icon: MagicWand, labelKey: 'upload.mode_beauty' },
    { id: 'before-after', icon: ArrowsLeftRight, labelKey: 'upload.mode_ba', locked: true },
    { id: 'product', icon: Package, labelKey: 'upload.mode_ad', locked: true },
    { id: 'batch', icon: Stack, labelKey: 'upload.mode_batch', locked: true },
];

export function UploadSection(): React.ReactElement {
    const { t, language } = useLanguage();

    const [mode, setMode] = useState<AppMode>('beauty');
    const [customSettings] = useState<PhotoSettings>(DEFAULT_SETTINGS);
    const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
    const [productSettings, setProductSettings] = useState<ProductAdSettings | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [showBAResults, setShowBAResults] = useState(false);
    const [showStories, setShowStories] = useState(false);
    const [retouchUrl, setRetouchUrl] = useState<string | null>(null);
    const [guestJob, setGuestJob] = useState<Job | null>(null);
    const [batchResult, setBatchResult] = useState<BatchCreateResult | null>(null);
    const [processingType] = useState<ProcessingType>('ENHANCE');

    const { job: uploadedJob, isUploading: isAuthUploading, error: uploadError, uploadFile } = useUpload();
    const pollId = uploadedJob?.id ?? (guestJob?.id === 'demo' ? null : guestJob?.id ?? null);
    const { job: polledJob, error: pollingError } = useJobPolling(pollId);
    const { job: baJob, isUploading: isBAUploading, upload: uploadBA, reset: resetBA } = useBeforeAfter();

    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const isProUser = false;

    const { data: creditBalance } = useCreditsBalance();
    const userCredits = creditBalance?.credits ?? 0;

    const { trends: currentTrends, isLoading: isLoadingTrends } = useCurrentTrends();
    const trendStyles: Style[] = useMemo(() =>
        (currentTrends ?? []).map((trend): FilterStyle => ({
            kind: 'filter' as const,
            id: `trend-${trend.id}`,
            categoryId: 'trends',
            name_ka: trend.title,
            name_ru: trend.title,
            previewUrl: trend.previewUrl,
            description_ka: trend.description ?? '',
            description_ru: trend.description ?? '',
            isPopular: false,
        })),
        [currentTrends],
    );

    const [isDemoJob, setIsDemoJob] = useState(false);

    useEffect(() => {
        if ((polledJob?.status === 'DONE' || uploadedJob) && isDemoJob) {
            setIsDemoJob(false);
            setGuestJob(null);
        }
    }, [polledJob, uploadedJob, isDemoJob]);

    // Reset to upload view when the upload request itself fails
    useEffect(() => {
        if (uploadError) {
            setShowResults(false);
            setGuestJob(null);
            setIsDemoJob(false);
        }
    }, [uploadError]);

    // Show toast when polling gives up after retries
    useEffect(() => {
        if (pollingError) {
            toast.error(pollingError);
        }
    }, [pollingError]);

    const currentJob = polledJob ?? uploadedJob ?? guestJob;
    const isUploading = isAuthUploading;

    const activeSettings: PhotoSettings = useMemo(() => {
        if (mode === 'beauty' && selectedStyle?.kind === 'preset') {
            return selectedStyle.settings;
        }
        return customSettings;
    }, [mode, selectedStyle, customSettings]);

    const handleFileSelect = useCallback(
        (file: File) => {
            const settings = selectedStyle?.kind === 'filter'
                ? { ...customSettings, processingType, filterId: selectedStyle.id }
                : selectedStyle?.kind === 'preset'
                    ? { ...selectedStyle.settings, processingType }
                    : { ...customSettings, processingType } as PhotoSettings;
            const previewImages = ['/presets/beauty/1.png'];
            const mockJob: Job = {
                id: 'demo',
                userId: isAuthenticated ? 'mock-user' : null,
                status: 'DONE',
                originalUrl: '',
                results: previewImages,
                createdAt: new Date().toISOString(),
            };
            setGuestJob(mockJob);
            setIsDemoJob(!isAuthenticated);
            if (isAuthenticated) {
                uploadFile({ file, settings });
            }
            setShowResults(true);
        },
        [uploadFile, customSettings, processingType, isAuthenticated, selectedStyle],
    );

    const handleBASubmit = useCallback(
        (beforeFile: File, afterFile: File) => {
            uploadBA({ beforeFile, afterFile });
            setShowBAResults(true);
        },
        [uploadBA],
    );

    const handleDownload = useCallback(async (url: string, jobId: string, variantIndex: number, branded: boolean = false) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
            const downloadUrl = `${apiBase}/jobs/${jobId}/download?variant=${variantIndex}&branded=${branded ? 1 : 0}`;
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `glowge-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(t('ui.text_tv2fdm'));
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    }, [t]);

    const handleBatchComplete = useCallback((result: BatchCreateResult) => {
        setBatchResult(result);
    }, []);

    const handleReset = useCallback(() => {
        setShowResults(false);
        setShowBAResults(false);
        setShowStories(false);
        setRetouchUrl(null);
        setGuestJob(null);
        setBatchResult(null);
        setIsDemoJob(false);
        setSelectedStyle(null);
        resetBA();
    }, [resetBA]);

    const ResetBar = (
        <div className="flex items-center justify-center gap-2 pt-4 pb-2">
            <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:border-border hover:shadow-sm"
            >
                <ArrowLeft size={12} />
                {t('ui.text_8kq3qa')}
            </button>
            <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
                <ArrowCounterClockwise size={12} />
                {t('ui.text_84crcz')}
            </button>
        </div>
    );

    // ── Before/After results ──
    if (showBAResults && baJob) {
        return (
            <div className="flex w-full flex-col overflow-y-auto p-5 md:p-6 [scrollbar-width:thin]">
                <BeforeAfterResults job={baJob} isAuthenticated={isAuthenticated} onDownload={handleDownload} />
                {(baJob.status === 'DONE' || baJob.status === 'FAILED') && ResetBar}
            </div>
        );
    }

    // ── Retouch ──
    if (showResults && currentJob && retouchUrl) {
        return (
            <div className="flex w-full flex-col overflow-y-auto p-5 md:p-6 [scrollbar-width:thin]">
                <RetouchPanel jobId={currentJob.id} imageUrl={retouchUrl} onClose={() => setRetouchUrl(null)} />
            </div>
        );
    }

    // ── Loading skeleton ──
    if (showResults && !currentJob) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-6 py-16 px-6">
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Sparkle size={28} weight="fill" className="animate-pulse text-primary" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-primary/5 animate-ping" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{t('upload.photo_uploading')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('upload.photo_sending')}</p>
                </div>
                <div className="flex w-full max-w-xs justify-center">
                    <div className="aspect-3/4 w-full animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
        );
    }

    // ── Results ──
    if (showResults && currentJob) {
        return (
            <div className="flex w-full flex-col gap-6 overflow-y-auto p-5 md:p-6 [scrollbar-width:thin]">
                {!isAuthenticated && currentJob.status === 'DONE' && (
                    <GuestResultBanner jobId={currentJob.id} />
                )}
                <ResultsGrid
                    job={currentJob}
                    isAuthenticated={isAuthenticated}
                    isDemo={isDemoJob}
                    onDownload={handleDownload}
                    onGenerateStories={() => setShowStories(true)}
                    onRetouch={setRetouchUrl}
                />
                {showStories && currentJob.status === 'DONE' && (
                    <StoriesGenerator jobId={currentJob.id} />
                )}
                {(currentJob.status === 'DONE' || currentJob.status === 'FAILED') && ResetBar}
            </div>
        );
    }

    // ── Editor — beauty studio layout ──
    return (
        <div className="flex w-full flex-col md:flex-row min-h-130">

            {/* ── Left: Lookbook panel ── */}
            <div className="flex flex-col gap-5 overflow-y-auto p-5 md:flex-1 md:border-r md:border-border/30 md:p-6 [scrollbar-width:thin]">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-foreground">{t('upload.style_title')}</p>
                        <p className="text-[11px] text-muted-foreground">{t('upload.style_subtitle')}</p>
                    </div>

                    {/* Mode selector — minimal pill */}
                    <div className="flex items-center gap-0.5 rounded-full border border-border/40 bg-muted/30 p-0.5">
                        {MODE_CONFIG.map(({ id, icon: Icon, labelKey, locked }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => !locked && setMode(id)}
                                disabled={locked}
                                title={locked ? t('upload.coming_soon') : t(labelKey)}
                                className={cn(
                                    'relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    locked
                                        ? 'cursor-not-allowed opacity-35'
                                        : mode === id
                                            ? 'bg-background shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon size={13} weight={mode === id ? 'bold' : 'regular'} />
                                {locked && (
                                    <Lock size={7} className="absolute bottom-0.5 right-0.5 text-muted-foreground/60" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Beauty mode — unified styles gallery */}
                {mode === 'beauty' && (
                    <StylesGallery
                        onSelect={setSelectedStyle}
                        selectedId={selectedStyle?.id ?? null}
                        trendStyles={trendStyles}
                        isLoadingTrends={isLoadingTrends}
                    />
                )}

                {mode === 'before-after' && (
                    <div className="flex flex-1 flex-col gap-2">
                        <BeforeAfterUpload onSubmit={handleBASubmit} isLoading={isBAUploading} />
                    </div>
                )}

                {mode === 'product' && (
                    <ProductAdPanel onSelect={setProductSettings} selected={productSettings} />
                )}

                {mode === 'batch' && (
                    <div className="flex flex-1 flex-col gap-3">
                        <p className="text-xs font-semibold text-foreground">{t('ui.text_k7mkxe')}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">{t('ui.text_tfog1p')}</p>
                        {batchResult && (
                            <div className="rounded-xl bg-primary/5 px-3 py-2">
                                <p className="text-[11px] font-medium text-primary">
                                    {batchResult.jobs.length} {t('ui.text_q39orv')}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{t('ui.text_eoo6v8')}</p>
                            </div>
                        )}
                        <BatchUploadZone onBatchComplete={handleBatchComplete} isProUser={isProUser} />
                    </div>
                )}
            </div>

            {/* ── Right: Beauty mirror upload ── */}
            <div className="flex flex-col gap-4 p-5 md:w-64 md:shrink-0 md:p-6 lg:w-72">

                {/* Mirror frame header */}
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                        <Camera size={12} weight="fill" className="text-primary" />
                    </div>
                    <p className="text-[11px] font-semibold text-foreground">
                        {mode === 'beauty'
                            ? t('ui.text_7cy30w')
                            : mode === 'before-after'
                                ? t('ui.text_qq3yy0')
                                : mode === 'batch'
                                    ? t('ui.text_xmvzsa')
                                    : t('ui.text_tewtuu')}
                    </p>
                </div>

                {/* Selected style preview */}
                {mode === 'beauty' && selectedStyle && (
                    <div className="flex flex-col gap-2">
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border/30">
                            <Image
                                src={selectedStyle.previewUrl}
                                alt={language === 'ka' ? selectedStyle.name_ka : selectedStyle.name_ru}
                                fill
                                className="object-cover"
                                sizes="280px"
                                unoptimized
                            />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-foreground">
                                {language === 'ka' ? selectedStyle.name_ka : selectedStyle.name_ru}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {language === 'ka' ? selectedStyle.description_ka : selectedStyle.description_ru}
                            </p>
                        </div>
                    </div>
                )}

                {/* Upload zone */}
                {mode === 'before-after' ? (
                    <BeforeAfterUpload onSubmit={handleBASubmit} isLoading={isBAUploading} />
                ) : mode === 'batch' ? (
                    <BatchUploadZone onBatchComplete={handleBatchComplete} isProUser={isProUser} />
                ) : (
                    <UploadZone onFileSelect={handleFileSelect} isLoading={isUploading} />
                )}

                {/* Credits + tip */}
                {mode !== 'before-after' && mode !== 'batch' && (
                    <div className="flex flex-col gap-2.5 rounded-xl border border-border/30 bg-muted/20 p-3">
                        {/* Credits line */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{t('ui.text_z9h1he')}</span>
                            <div className="flex items-center gap-1">
                                <Sparkle size={9} weight="fill" className="text-primary" />
                                <span className="text-[11px] font-semibold tabular-nums text-foreground">{userCredits}</span>
                            </div>
                        </div>

                        {/* Tip */}
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                            {selectedStyle
                                ? t('upload.style_selected_tip')
                                : t('upload.no_style_tip')}
                        </p>

                        {/* CTA — if no auth */}
                        {!isAuthenticated && (
                            <a
                                href="/register"
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary transition-colors duration-150 hover:bg-primary/15"
                            >
                                {t('upload.sign_up_for_more')}
                                <ArrowRight size={9} weight="bold" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
