'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

import { ROUTES } from '@/lib/constants/routes';
import { getErrorMessage } from '@/lib/utils/error';
import { downloadImage } from '@/lib/utils/download';
import type { RootState } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { updateCredits } from '@/features/auth/store/authSlice';
import { useUpload } from './useUpload';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { useBeforeAfter } from '@/features/before-after/hooks/useBeforeAfter';
import { useCreditsBalance } from '@/features/credits/hooks/useCredits';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { useDailyUsage } from '@/features/jobs/hooks/useDailyUsage';
import { useCurrentTrends } from '@/features/trends/hooks/useTrends';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { PhotoSettings, ProcessingType } from '../types/upload.types';
import { DEFAULT_SETTINGS } from '../types/upload.types';
import type { Style, FilterStyle, MasterPrompt, PromptVariableValues } from '@/features/filters/types/styles.types';
import type { AppMode } from '../types/presets.types';
import type { ProductAdSettings } from '../components/ProductAdPanel';
import type { BatchCreateResult } from '@/features/jobs/types/job.types';
import type { BeforeAfterJob } from '@/features/before-after/types/before-after.types';

export interface StudioState {
    t: (key: string) => string;
    language: string;
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    selectedStyle: Style | null;
    setSelectedStyle: (style: Style | null) => void;
    selectedMasterPrompt: MasterPrompt | null;
    setSelectedMasterPrompt: (mp: MasterPrompt | null) => void;
    promptVariables: PromptVariableValues;
    setPromptVariables: (vars: PromptVariableValues) => void;
    productSettings: ProductAdSettings | null;
    setProductSettings: (settings: ProductAdSettings | null) => void;
    showStories: boolean;
    setShowStories: (v: boolean) => void;
    retouchUrl: string | null;
    setRetouchUrl: (url: string | null) => void;
    batchResult: BatchCreateResult | null;
    currentJob: null;
    isUploading: boolean;
    isAuthenticated: boolean;
    isProUser: boolean;
    userCredits: number;
    trendStyles: Style[];
    isLoadingTrends: boolean;
    baJob: BeforeAfterJob | null;
    isBAUploading: boolean;
    handleFileSelect: (file: File) => void;
    handleBASubmit: (beforeFile: File, afterFile: File) => void;
    handleDownload: (url: string, jobId: string, variantIndex: number, branded?: boolean) => Promise<void>;
    handleBatchComplete: (result: BatchCreateResult) => void;
    handleReset: () => void;
    isCustomized: boolean;
    masterPromptCost: number;
    isLimitReached: boolean;
    countdown: string;
    refetchDailyUsage: () => Promise<void>;
}

export function useStudioState(): StudioState {
    const { t, language } = useLanguage();
    const router = useRouter();

    const [mode, setMode] = useState<AppMode>('beauty');
    const [customSettings] = useState<PhotoSettings>(DEFAULT_SETTINGS);
    const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
    const [selectedMasterPrompt, setSelectedMasterPrompt] = useState<MasterPrompt | null>(null);
    const [promptVariables, setPromptVariables] = useState<PromptVariableValues>({});
    const [productSettings, setProductSettings] = useState<ProductAdSettings | null>(null);
    const [showStories, setShowStories] = useState(false);
    const [retouchUrl, setRetouchUrl] = useState<string | null>(null);
    const [batchResult, setBatchResult] = useState<BatchCreateResult | null>(null);
    const [processingType] = useState<ProcessingType>('ENHANCE');

    // 2 credits only when ALL extras are selected; everything else = 1 credit
    const isCustomized = useMemo(() => {
        if (!selectedMasterPrompt) return false;
        const extrasVar = selectedMasterPrompt.variables.find(v => v.id === 'EXTRAS');
        if (!extrasVar) return false;
        const selected = Array.isArray(promptVariables.EXTRAS) ? promptVariables.EXTRAS : [];
        return selected.length === extrasVar.options.length && extrasVar.options.length > 0;
    }, [selectedMasterPrompt, promptVariables]);
    const masterPromptCost = isCustomized ? 2 : 1;

    const { isUploading, error: uploadError, uploadFile } = useUpload({
        onJobCreated: (job) => {
            router.replace(ROUTES.CREATE_RESULT(job.id));
        },
    });
    const { job: baJob, isUploading: isBAUploading, upload: uploadBA, reset: resetBA } = useBeforeAfter();

    const dispatch = useAppDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    const { data: creditBalance } = useCreditsBalance();
    const { remaining: dailyRemaining, isLimitReached, countdown, refetch: refetchDailyUsage } = useDailyUsage();
    const userCredits = IS_LAUNCH_MODE ? dailyRemaining : (creditBalance?.credits ?? 0);

    const { trends: currentTrends, isLoading: isLoadingTrends } = useCurrentTrends();
    const trendStyles: Style[] = useMemo(() =>
        (currentTrends ?? []).map((trend): FilterStyle => ({
            kind: 'filter' as const,
            id: `trend-${trend.id}`,
            categoryId: 'trends',
            name_ka: trend.title,
            name_ru: trend.title,
            name_en: trend.title,
            previewUrl: trend.previewUrl,
            description_ka: trend.description ?? '',
            description_ru: trend.description ?? '',
            description_en: trend.description ?? '',
            isPopular: false,
        })),
        [currentTrends],
    );

    useEffect(() => {
        if (uploadError) {
            toast.error(uploadError);
            router.replace(ROUTES.CREATE);
        }
    }, [uploadError, router]);

    const handleFileSelect = useCallback(
        (file: File) => {
            let settings: PhotoSettings;

            if (selectedMasterPrompt) {
                // Master prompt: customized = RETOUCH (2 credits), defaults = ENHANCE (1 credit)
                const mpProcessingType: ProcessingType = isCustomized ? 'RETOUCH' : 'ENHANCE';
                settings = { ...customSettings, processingType: mpProcessingType, filterId: selectedMasterPrompt.id, promptVariables };
            } else if (selectedStyle?.kind === 'filter') {
                settings = { ...customSettings, processingType, filterId: selectedStyle.id };
            } else if (selectedStyle?.kind === 'preset') {
                settings = { ...selectedStyle.settings, processingType };
            } else {
                settings = { ...customSettings, processingType };
            }

            // Pre-check: block generation if credits are exhausted
            if (IS_LAUNCH_MODE) {
                if (isLimitReached) {
                    toast.error(t('upload.daily_limit_reached'));
                    return;
                }
            } else {
                if (userCredits <= 0) {
                    toast.error(t('upload.no_credits'));
                    return;
                }
            }

            uploadFile({ file, settings });
        },
        [uploadFile, customSettings, processingType, selectedStyle, selectedMasterPrompt, promptVariables, isCustomized, isLimitReached, userCredits, t],
    );

    const handleBASubmit = useCallback(
        (beforeFile: File, afterFile: File) => {
            const baId = `ba-${Date.now()}`;
            uploadBA({ beforeFile, afterFile });
            router.push(ROUTES.CREATE_RESULT(baId));
        },
        [uploadBA, router],
    );

    const handleDownload = useCallback(async (url: string, jobId: string, variantIndex: number, branded: boolean = false) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
            const downloadUrl = `${apiBase}/jobs/${jobId}/download?variant=${variantIndex}&branded=${branded ? 1 : 0}`;
            await downloadImage(downloadUrl, `glowge-${Date.now()}.jpg`);
            toast.success(t('ui.text_tv2fdm'));
        } catch (err) {
            // User cancelled share sheet — not an error
            if (err instanceof Error && err.name === 'AbortError') return;
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
        setShowStories(false);
        setRetouchUrl(null);
        setBatchResult(null);
        setSelectedStyle(null);
        setSelectedMasterPrompt(null);
        setPromptVariables({});
        resetBA();
        router.push(ROUTES.CREATE);
    }, [resetBA, router]);

    return {
        t,
        language,
        mode,
        setMode,
        selectedStyle,
        setSelectedStyle,
        selectedMasterPrompt,
        setSelectedMasterPrompt,
        promptVariables,
        setPromptVariables,
        productSettings,
        setProductSettings,
        showStories,
        setShowStories,
        retouchUrl,
        setRetouchUrl,
        batchResult,
        currentJob: null,
        isUploading,
        isAuthenticated,
        isProUser: IS_LAUNCH_MODE,
        userCredits,
        trendStyles,
        isLoadingTrends,
        baJob,
        isBAUploading,
        handleFileSelect,
        handleBASubmit,
        handleDownload,
        handleBatchComplete,
        handleReset,
        isCustomized,
        masterPromptCost,
        isLimitReached: IS_LAUNCH_MODE ? isLimitReached : false,
        countdown,
        refetchDailyUsage,
    };
}
