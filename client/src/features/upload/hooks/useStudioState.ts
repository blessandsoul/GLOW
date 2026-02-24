'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/utils/error';
import type { RootState } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { updateCredits } from '@/features/auth/store/authSlice';
import { useUpload } from './useUpload';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { useBeforeAfter } from '@/features/before-after/hooks/useBeforeAfter';
import { useCreditsBalance } from '@/features/credits/hooks/useCredits';
import { useCurrentTrends } from '@/features/trends/hooks/useTrends';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { PhotoSettings, ProcessingType } from '../types/upload.types';
import { DEFAULT_SETTINGS } from '../types/upload.types';
import type { Style, FilterStyle } from '@/features/filters/types/styles.types';
import type { AppMode } from '../types/presets.types';
import type { ProductAdSettings } from '../components/ProductAdPanel';
import type { Job, BatchCreateResult } from '@/features/jobs/types/job.types';
import type { BeforeAfterJob } from '@/features/before-after/types/before-after.types';

export interface StudioState {
    t: (key: string) => string;
    language: string;
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    selectedStyle: Style | null;
    setSelectedStyle: (style: Style | null) => void;
    productSettings: ProductAdSettings | null;
    setProductSettings: (settings: ProductAdSettings | null) => void;
    showResults: boolean;
    showBAResults: boolean;
    showStories: boolean;
    setShowStories: (v: boolean) => void;
    retouchUrl: string | null;
    setRetouchUrl: (url: string | null) => void;
    batchResult: BatchCreateResult | null;
    currentJob: Job | null;
    isUploading: boolean;
    isAuthenticated: boolean;
    isProUser: boolean;
    userCredits: number;
    isDemoJob: boolean;
    trendStyles: Style[];
    isLoadingTrends: boolean;
    baJob: BeforeAfterJob | null;
    isBAUploading: boolean;
    handleFileSelect: (file: File) => void;
    handleBASubmit: (beforeFile: File, afterFile: File) => void;
    handleDownload: (url: string, jobId: string, variantIndex: number, branded?: boolean) => Promise<void>;
    handleBatchComplete: (result: BatchCreateResult) => void;
    handleReset: () => void;
}

export function useStudioState(): StudioState {
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
    const [isDemoJob, setIsDemoJob] = useState(false);

    const { job: uploadedJob, isUploading: isAuthUploading, error: uploadError, uploadFile } = useUpload();
    const pollId = uploadedJob?.id ?? (guestJob?.id === 'demo' ? null : guestJob?.id ?? null);
    const { job: polledJob, error: pollingError } = useJobPolling(pollId);
    const { job: baJob, isUploading: isBAUploading, upload: uploadBA, reset: resetBA } = useBeforeAfter();

    const dispatch = useAppDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

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

    useEffect(() => {
        if ((polledJob?.status === 'DONE' || uploadedJob) && isDemoJob) {
            setIsDemoJob(false);
            setGuestJob(null);
        }
    }, [polledJob, uploadedJob, isDemoJob]);

    useEffect(() => {
        if (uploadError) {
            setShowResults(false);
            setGuestJob(null);
            setIsDemoJob(false);
        }
    }, [uploadError]);

    useEffect(() => {
        if (pollingError) {
            toast.error(pollingError);
        }
    }, [pollingError]);

    const currentJob = polledJob ?? uploadedJob ?? guestJob;
    const isUploading = isAuthUploading;

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
        if (result.creditsRemaining !== undefined) {
            dispatch(updateCredits(result.creditsRemaining));
        }
    }, [dispatch]);

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

    return {
        t,
        language,
        mode,
        setMode,
        selectedStyle,
        setSelectedStyle,
        productSettings,
        setProductSettings,
        showResults,
        showBAResults,
        showStories,
        setShowStories,
        retouchUrl,
        setRetouchUrl,
        batchResult,
        currentJob,
        isUploading,
        isAuthenticated,
        isProUser: false,
        userCredits,
        isDemoJob,
        trendStyles,
        isLoadingTrends,
        baJob,
        isBAUploading,
        handleFileSelect,
        handleBASubmit,
        handleDownload,
        handleBatchComplete,
        handleReset,
    };
}
