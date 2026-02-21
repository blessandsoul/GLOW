'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
    MagicWand, Package, ArrowsLeftRight, ArrowLeft, ArrowCounterClockwise,
    SquaresFour, TrendUp, SlidersHorizontal, Sparkle, Stack, Lock,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UploadZone } from './UploadZone';
import { PhotoSettingsPanel } from './PhotoSettingsPanel';
import { BeautyPresetsPanel } from './BeautyPresetsPanel';
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
import { creditsService } from '@/features/credits/services/credits.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { RootState } from '@/store';
import type { PhotoSettings, ProcessingType } from '../types/upload.types';
import { DEFAULT_SETTINGS } from '../types/upload.types';
import { ProcessingTypeSelector } from './ProcessingTypeSelector';
import { useCreditsBalance } from '@/features/credits/hooks/useCredits';
import { TrendTemplatesPanel } from '@/features/trends/components/TrendTemplatesPanel';
import { StoriesGenerator } from '@/features/stories/components/StoriesGenerator';
import { RetouchPanel } from '@/features/retouch/components/RetouchPanel';
import type { AppMode } from '../types/presets.types';
import type { Job, BatchCreateResult } from '@/features/jobs/types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

type BeautyTab = 'custom' | 'presets' | 'trends';

export function UploadSection(): React.ReactElement {
    const { t } = useLanguage();

    const MODE_TABS = [
        { id: 'beauty' as AppMode, icon: MagicWand, label: t('upload.mode_beauty') },
        { id: 'before-after' as AppMode, icon: ArrowsLeftRight, label: t('upload.mode_ba') },
        { id: 'product' as AppMode, icon: Package, label: t('upload.mode_ad') },
        { id: 'batch' as AppMode, icon: Stack, label: t('upload.mode_batch') },
    ];

    const BEAUTY_TABS = [
        { id: 'presets' as BeautyTab, icon: SquaresFour, label: t('upload.tab_presets') },
        { id: 'trends' as BeautyTab, icon: TrendUp, label: t('upload.tab_trends') },
        { id: 'custom' as BeautyTab, icon: SlidersHorizontal, label: t('upload.tab_custom') },
    ];
    const [mode, setMode] = useState<AppMode>('beauty');
    const [beautyTab, setBeautyTab] = useState<BeautyTab>('presets');
    const [customSettings, setCustomSettings] = useState<PhotoSettings>(DEFAULT_SETTINGS);
    const [presetSettings, setPresetSettings] = useState<PhotoSettings | null>(null);
    const [productSettings, setProductSettings] = useState<ProductAdSettings | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [showBAResults, setShowBAResults] = useState(false);
    const [showStories, setShowStories] = useState(false);
    const [retouchUrl, setRetouchUrl] = useState<string | null>(null);
    const [guestJob, setGuestJob] = useState<Job | null>(null);
    const [batchResult, setBatchResult] = useState<BatchCreateResult | null>(null);
    const [processingType, setProcessingType] = useState<ProcessingType>('ENHANCE');

    const { job: uploadedJob, isUploading: isAuthUploading, uploadFile } = useUpload();
    // Don't poll demo jobs — they're already in DONE state
    const pollId = guestJob?.id === 'demo' ? null : (uploadedJob?.id ?? guestJob?.id ?? null);
    const { job: polledJob } = useJobPolling(pollId);
    const { job: baJob, isUploading: isBAUploading, upload: uploadBA, reset: resetBA } = useBeforeAfter();

    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const isProUser = false; // TODO: replace with credits-based check

    const { data: creditBalance } = useCreditsBalance();
    const userCredits = creditBalance?.credits ?? 0;

    const [isDemoJob, setIsDemoJob] = useState(false);

    // When real job arrives from backend, clear demo flag
    useEffect(() => {
        if ((polledJob?.status === 'DONE' || uploadedJob) && isDemoJob) {
            setIsDemoJob(false);
            setGuestJob(null);
        }
    }, [polledJob, uploadedJob, isDemoJob]);

    // Resolve current job: polled state takes priority (has latest status)
    const currentJob = polledJob ?? uploadedJob ?? guestJob;

    const isUploading = isAuthUploading;

    const activeSettings: PhotoSettings =
        mode === 'beauty'
            ? (beautyTab === 'presets' && presetSettings ? presetSettings : customSettings)
            : customSettings;

    const handleFileSelect = useCallback(
        (file: File) => {
            const settingsWithProcessing = { ...activeSettings, processingType };
            // Always show mock immediately so user sees the results page instantly
            const previewImages = [1, 2, 3, 4].map((n) => `/presets/beauty/${n}.png`);
            const mockJob: Job = {
                id: 'demo',
                userId: isAuthenticated ? 'mock-user' : null,
                status: 'DONE',
                originalUrl: '',
                results: previewImages,
                createdAt: new Date().toISOString(),
            };
            setGuestJob(mockJob);
            // Auth users see full paid results (no demo banner/blur)
            setIsDemoJob(!isAuthenticated);
            if (isAuthenticated) {
                uploadFile({ file, settings: settingsWithProcessing });
            }
            setShowResults(true);
        },
        [uploadFile, activeSettings, processingType, isAuthenticated],
    );

    const handleBASubmit = useCallback(
        (beforeFile: File, afterFile: File) => {
            uploadBA({ beforeFile, afterFile });
            setShowBAResults(true);
        },
        [uploadBA],
    );

    const handleDownload = useCallback(async (url: string, jobId: string, variantIndex: number) => {
        try {
            await creditsService.useCredit(jobId);
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
            const downloadUrl = `${apiBase}/jobs/${jobId}/download?variant=${variantIndex}`;
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
    }, []);

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
        resetBA();
    }, [resetBA]);

    const ResetBar = (
        <div className="flex items-center justify-center gap-2 pt-4 pb-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-4 text-xs" onClick={handleReset}>
                <ArrowLeft size={12} />
                {t('ui.text_8kq3qa')}</Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-4 text-xs text-muted-foreground" onClick={handleReset}>
                <ArrowCounterClockwise size={12} />
                {t('ui.text_84crcz')}</Button>
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

    // ── Uploading / waiting for job to be created (auth users only) ──
    if (showResults && !currentJob) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-5 py-16">
                <div className="rounded-full bg-primary/10 p-5">
                    <Sparkle size={36} className="animate-pulse text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-base font-semibold text-foreground">ფოტო იტვირთება...</p>
                    <p className="mt-1 text-sm text-muted-foreground">გადაგზავნა დამუშავებაზე, მოიცადეთ</p>
                </div>
                <div className="grid w-full max-w-sm grid-cols-2 gap-3 px-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-3/4 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            </div>
        );
    }

    // ── Single photo results ──
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

    // ── Editor ──
    return (
        <div className="flex w-full flex-col overflow-hidden md:flex-row">

            {/* ── Left: Settings panel ── */}
            <div
                className="flex flex-col gap-4 overflow-y-auto p-5 md:flex-1 md:border-r md:border-border/30 md:p-6 [scrollbar-width:thin]"
            >
                {/* Section label */}
                <div className="flex items-center gap-2">
                    <Sparkle size={12} weight="fill" className="text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {t('ui.text_l1ph3p')}</span>
                </div>

                {/* Mode tabs */}
                <div className="flex flex-wrap gap-1 rounded-xl border border-border/40 bg-muted/30 p-1 w-fit">
                    {MODE_TABS.map(({ id, icon: Icon, label }) => {
                        const isLocked = id !== 'beauty';
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => !isLocked && setMode(id)}
                                disabled={isLocked}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    isLocked
                                        ? 'cursor-not-allowed opacity-40'
                                        : mode === id
                                            ? 'bg-background text-foreground shadow-sm ring-1 ring-border/30'
                                            : 'text-muted-foreground hover:text-foreground/80',
                                )}
                            >
                                <Icon size={13} weight={mode === id ? 'bold' : 'regular'} />
                                {label}
                                {isLocked && <Lock size={11} className="text-muted-foreground/60" />}
                            </button>
                        );
                    })}
                </div>

                {/* Beauty sub-tabs + content */}
                {mode === 'beauty' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-0.5 rounded-lg border border-border/30 bg-muted/20 p-0.5 w-fit">
                            {BEAUTY_TABS.map(({ id, icon: Icon, label }) => {
                                const isTabLocked = id !== 'presets';
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => !isTabLocked && setBeautyTab(id)}
                                        disabled={isTabLocked}
                                        className={cn(
                                            'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                            isTabLocked
                                                ? 'cursor-not-allowed opacity-40'
                                                : beautyTab === id
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground/70',
                                        )}
                                    >
                                        <Icon size={11} />
                                        {label}
                                        {isTabLocked && <Lock size={10} className="text-muted-foreground/50" />}
                                    </button>
                                );
                            })}
                        </div>

                        {beautyTab === 'presets' && (
                            <BeautyPresetsPanel onSelect={setPresetSettings} selected={presetSettings} />
                        )}
                        {beautyTab === 'trends' && <TrendTemplatesPanel />}
                        {beautyTab === 'custom' && (
                            <PhotoSettingsPanel onConfirm={setCustomSettings} />
                        )}
                    </div>
                )}

                {mode === 'before-after' && (
                    <div className="flex flex-col gap-2 rounded-xl border border-border/30 bg-muted/20 p-4">
                        <p className="text-xs font-semibold text-foreground">{t('ui.text_g4cwqj')}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {t('ui.text_46rg2q')}</p>
                    </div>
                )}

                {mode === 'product' && (
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {t('ui.text_wg3tf5')}</p>
                        <ProductAdPanel onSelect={setProductSettings} selected={productSettings} />
                    </div>
                )}

                {mode === 'batch' && (
                    <div className="flex flex-col gap-2 rounded-xl border border-border/30 bg-muted/20 p-4">
                        <p className="text-xs font-semibold text-foreground">{t('ui.text_k7mkxe')}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {t('ui.text_tfog1p')}</p>
                        {batchResult && (
                            <div className="mt-1 rounded-lg bg-primary/5 px-3 py-2">
                                <p className="text-[11px] font-medium text-primary">
                                    {batchResult.jobs.length} {t('ui.text_q39orv')}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {t('ui.text_eoo6v8')}</p>
                            </div>
                        )}
                    </div>
                )}

                {mode !== 'batch' && (
                    <div className="relative flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {t('ui.text_y35ouf')}</span>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                                {t('ui.text_z9h1he')}<span className="font-medium text-foreground">{userCredits}</span> {t('ui.text_n0dk')}</span>
                        </div>
                        <div className="pointer-events-none opacity-40">
                            <ProcessingTypeSelector
                                selected={processingType}
                                onSelect={setProcessingType}
                                userCredits={userCredits}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                            <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-3 py-1.5 backdrop-blur-sm">
                                <Lock size={11} className="text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground">{t('upload.coming_soon') || 'Скоро'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right: Upload zone ── */}
            <div className="flex flex-col gap-4 border-t border-border/30 bg-muted/10 p-5 md:w-72 md:shrink-0 md:border-l md:border-t-0 md:p-6">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {mode === 'beauty'
                            ? t('ui.text_7cy30w')
                            : mode === 'before-after'
                                ? t('ui.text_qq3yy0')
                                : mode === 'batch'
                                    ? t('ui.text_xmvzsa')
                                    : t('ui.text_tewtuu')}
                    </p>
                </div>

                {mode === 'before-after' ? (
                    <BeforeAfterUpload onSubmit={handleBASubmit} isLoading={isBAUploading} />
                ) : mode === 'batch' ? (
                    <BatchUploadZone
                        onBatchComplete={handleBatchComplete}
                        isProUser={isProUser}
                    />
                ) : (
                    <UploadZone onFileSelect={handleFileSelect} isLoading={isUploading} />
                )}

                {/* ── Info block ── */}
                {mode !== 'before-after' && mode !== 'batch' && (
                    <div className="flex flex-col gap-2 rounded-xl border border-border/30 bg-background/60 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                                <Sparkle size={11} weight="fill" className="text-primary" />
                            </div>
                            <p className="text-[10px] font-semibold text-foreground">
                                {t('ui.text_l1ph3p')}
                            </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {[
                                t('ui.text_wsl1xq'),
                                'JPG, PNG, WEBP · max 10 MB',
                                t('ui.text_z9h1he') + ' ' + userCredits,
                            ].map((line, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                                    <p className="text-[10px] leading-relaxed text-muted-foreground">{line}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
