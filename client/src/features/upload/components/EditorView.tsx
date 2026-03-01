'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
    MagicWand, Package, ArrowsLeftRight, ArrowRight,
    Sparkle, Stack, Lock, Camera, X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { UploadZone } from './UploadZone';
import { StylesGallery } from '@/features/filters/components/StylesGallery';
import { StyleStrip } from '@/features/filters/components/StyleStrip';
import { StyleDrawer } from '@/features/filters/components/StyleDrawer';
import { PromptConfigurator } from '@/features/filters/components/PromptConfigurator';
import { GenerateBar } from './GenerateBar';
import { ProductAdPanel } from './ProductAdPanel';
import { BeforeAfterUpload } from '@/features/before-after/components/BeforeAfterUpload';
import { BatchUploadZone } from './BatchUploadZone';
import filtersData from '@/features/filters/data/filters.json';
import type { Style, FilterStyle, StyleCategory, StyleSubcategory, MasterPrompt, PromptVariableValues } from '@/features/filters/types/styles.types';
import type { AppMode } from '../types/presets.types';
import type { ProductAdSettings } from './ProductAdPanel';
import type { BatchCreateResult } from '@/features/jobs/types/job.types';
import { localized } from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';

const MODE_CONFIG: { id: AppMode; icon: typeof MagicWand; labelKey: string; locked?: boolean }[] = [
    { id: 'beauty', icon: MagicWand, labelKey: 'upload.mode_beauty' },
    { id: 'before-after', icon: ArrowsLeftRight, labelKey: 'upload.mode_ba', locked: true },
    { id: 'product', icon: Package, labelKey: 'upload.mode_ad', locked: true },
    { id: 'batch', icon: Stack, labelKey: 'upload.mode_batch', locked: true },
];

interface EditorViewProps {
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
    trendStyles: Style[];
    isLoadingTrends: boolean;
    batchResult: { jobs: { id: string }[]; creditsRemaining?: number } | null;
    isUploading: boolean;
    isAuthenticated: boolean;
    isProUser: boolean;
    userCredits: number;
    handleFileSelect: (file: File) => void;
    handleBASubmit: (beforeFile: File, afterFile: File) => void;
    handleBatchComplete: (result: BatchCreateResult) => void;
    isBAUploading: boolean;
    isCustomized: boolean;
    masterPromptCost: number;
    isLimitReached: boolean;
}

export function EditorView({
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
    trendStyles,
    isLoadingTrends,
    batchResult,
    isUploading,
    isAuthenticated,
    isProUser,
    userCredits,
    handleFileSelect,
    handleBASubmit,
    handleBatchComplete,
    isBAUploading,
    isCustomized,
    masterPromptCost,
    isLimitReached,
}: EditorViewProps): React.ReactElement {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    // Static styles from filters.json — always available, unlike trends API
    const staticCategories = useMemo(() => {
        const raw = filtersData as { categories: StyleCategory[]; subcategories: StyleSubcategory[]; filters: Array<Record<string, unknown>> };
        return raw.categories;
    }, []);
    const staticSubcategories = useMemo(() => {
        const raw = filtersData as { subcategories: StyleSubcategory[] };
        return raw.subcategories ?? [];
    }, []);
    const staticStylesByCategory = useMemo(() => {
        const raw = filtersData as { filters: Array<Record<string, unknown>> };
        const styles = raw.filters.map((f) => ({ ...f, kind: 'filter' as const } as FilterStyle));
        const map: Record<string, Style[]> = {};
        for (const s of styles) {
            (map[s.categoryId] ??= []).push(s);
        }
        return map;
    }, []);
    const staticStylesBySubcategory = useMemo(() => {
        const raw = filtersData as { filters: Array<Record<string, unknown>> };
        const styles = raw.filters.map((f) => ({ ...f, kind: 'filter' as const } as FilterStyle));
        const map: Record<string, Style[]> = {};
        for (const s of styles) {
            if (s.subcategoryId) {
                (map[s.subcategoryId] ??= []).push(s);
            }
        }
        return map;
    }, []);
    const staticMasterPrompts = useMemo(() => {
        const raw = filtersData as { masterPrompts?: MasterPrompt[] };
        return raw.masterPrompts ?? [];
    }, []);
    const masterPromptsByCategory = useMemo(() => {
        const map: Record<string, MasterPrompt[]> = {};
        for (const mp of staticMasterPrompts) {
            (map[mp.categoryId] ??= []).push(mp);
        }
        return map;
    }, [staticMasterPrompts]);

    const handleMasterPromptSelect = useCallback((mp: MasterPrompt) => {
        setSelectedMasterPrompt(mp);
        setSelectedStyle(null);
        // Initialize with defaults
        const defaults: PromptVariableValues = {};
        for (const v of mp.variables) {
            defaults[v.id] = v.default;
        }
        setPromptVariables(defaults);
    }, [setSelectedMasterPrompt, setSelectedStyle, setPromptVariables]);

    const handleMasterPromptBack = useCallback(() => {
        setSelectedMasterPrompt(null);
        setPromptVariables({});
    }, [setSelectedMasterPrompt, setPromptVariables]);

    const handleStyleSelect = useCallback((style: Style) => {
        setSelectedStyle(style);
        setSelectedMasterPrompt(null);
        setPromptVariables({});
    }, [setSelectedStyle, setSelectedMasterPrompt, setPromptVariables]);

    const handlePendingFileChange = useCallback((file: File | null) => {
        setPendingFile(file);
    }, []);

    const handleMobileGenerate = useCallback(() => {
        if (pendingFile) handleFileSelect(pendingFile);
    }, [pendingFile, handleFileSelect]);

    const handleQuickGenerate = useCallback(() => {
        if (pendingFile) handleFileSelect(pendingFile);
    }, [pendingFile, handleFileSelect]);

    return (
        <div className="flex w-full flex-col md:flex-row">

            {/* ──── Horizontal style strip: mobile FIRST (order-1), hidden on desktop ──── */}
            {mode === 'beauty' && (
                <div className="order-1 pt-3 pb-1 md:hidden">
                    <StyleStrip
                        categories={staticCategories}
                        subcategories={staticSubcategories}
                        stylesByCategory={staticStylesByCategory}
                        stylesBySubcategory={staticStylesBySubcategory}
                        masterPromptsByCategory={masterPromptsByCategory}
                        selectedId={selectedStyle?.id ?? selectedMasterPrompt?.id ?? null}
                        onSelect={handleStyleSelect}
                        onMasterPromptSelect={handleMasterPromptSelect}
                        onBrowseAll={() => setDrawerOpen(true)}
                        language={language as SupportedLanguage}
                    />
                </div>
            )}

            {/* ──── Selected style badge: mobile only, order-2 (regular styles only) ──── */}
            {mode === 'beauty' && selectedStyle && !selectedMasterPrompt && (
                <div className="order-2 flex items-center gap-2.5 px-4 py-2 md:hidden">
                    <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md border border-primary/30">
                        {selectedStyle.previewUrl !== '/filters/placeholder.svg' && selectedStyle.previewUrl ? (
                            <Image src={selectedStyle.previewUrl} alt="" fill className="object-cover" sizes="32px" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/5">
                                <Sparkle size={10} className="text-primary/30" weight="fill" />
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-medium text-foreground">
                        {localized(selectedStyle, 'name', language as SupportedLanguage)}
                    </span>
                    <button
                        type="button"
                        onClick={() => { setSelectedStyle(null); }}
                        className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <X size={10} weight="bold" />
                    </button>
                </div>
            )}

            {/* ──── Prompt Configurator: mobile only, order-2 (master prompts only) ──── */}
            {mode === 'beauty' && selectedMasterPrompt && (
                <div className="order-2 px-4 py-2 md:hidden">
                    <PromptConfigurator
                        masterPrompt={selectedMasterPrompt}
                        variables={promptVariables}
                        onVariablesChange={setPromptVariables}
                        onBack={handleMasterPromptBack}
                        onQuickGenerate={handleQuickGenerate}
                        language={language as SupportedLanguage}
                        t={t}
                        isCustomized={isCustomized}
                        cost={masterPromptCost}
                    />
                </div>
            )}

            {/* ──── Upload zone: order-3 on mobile, right side on desktop (md:order-2) ──── */}
            <div className="order-3 px-4 pt-3 pb-5 md:order-2 md:w-72 md:shrink-0 md:p-6 lg:w-80">
                {/* Mirror frame header — desktop only */}
                <div className="hidden md:flex items-center gap-2 mb-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                        <Camera size={12} weight="fill" className="text-primary" />
                    </div>
                    <p className="text-[11px] font-semibold text-foreground">
                        {mode === 'beauty' ? t('ui.text_7cy30w') : mode === 'before-after' ? t('ui.text_qq3yy0') : mode === 'batch' ? t('ui.text_xmvzsa') : t('ui.text_tewtuu')}
                    </p>
                </div>

                {/* Selected style preview — desktop only */}
                {mode === 'beauty' && selectedStyle && (
                    <div className="hidden md:flex flex-col gap-2 mb-4">
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border/30">
                            {selectedStyle.previewUrl === '/filters/placeholder.svg' ? (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                                    <Sparkle size={32} className="text-primary/30" weight="fill" />
                                </div>
                            ) : (
                                <Image
                                    src={selectedStyle.previewUrl}
                                    alt={localized(selectedStyle, 'name', language as SupportedLanguage)}
                                    fill
                                    className="object-cover"
                                    sizes="280px"
                                />
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-foreground">
                                {localized(selectedStyle, 'name', language as SupportedLanguage)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {localized(selectedStyle, 'description', language as SupportedLanguage)}
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
                    <UploadZone
                        onFileSelect={handleFileSelect}
                        isLoading={isUploading}
                        hideGenerateButton
                        onPendingFileChange={handlePendingFileChange}
                    />
                )}

                {/* Generate button — desktop only */}
                {mode === 'beauty' && pendingFile && (selectedStyle || selectedMasterPrompt) && (
                    <div className="hidden md:block mt-3">
                        <GenerateBar
                            variant="inline"
                            onGenerate={handleMobileGenerate}
                            isLoading={isUploading}
                            disabled={!pendingFile || (!selectedStyle && !selectedMasterPrompt) || isLimitReached}
                            isAuthenticated={isAuthenticated}
                        />
                    </div>
                )}

                {/* Credits + tip — desktop only */}
                {mode !== 'before-after' && mode !== 'batch' && (
                    <div className="hidden md:flex flex-col gap-2.5 rounded-xl border border-border/30 bg-muted/20 p-3 mt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{t('ui.text_z9h1he')}</span>
                            <div className="flex items-center gap-1">
                                <Sparkle size={9} weight="fill" className="text-primary" />
                                <span className="text-[11px] font-semibold tabular-nums text-foreground">{userCredits}</span>
                            </div>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                            {(selectedStyle || selectedMasterPrompt) ? t('upload.style_selected_tip') : t('upload.no_style_tip')}
                        </p>
                        {!isAuthenticated && (
                            <a href="/register" className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary transition-colors duration-150 hover:bg-primary/15">
                                {t('upload.sign_up_for_more')}
                                <ArrowRight size={9} weight="bold" />
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* ──── Full styles panel: desktop only, order-1 ──── */}
            <div className="hidden md:flex md:order-1 md:flex-1 md:flex-col md:gap-5 md:overflow-y-auto md:border-r md:border-border/30 md:p-6 [scrollbar-width:thin]">
                {/* Header + mode selector */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-foreground">{t('upload.style_title')}</p>
                        <p className="text-[11px] text-muted-foreground">{t('upload.style_subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-full border border-border/40 bg-muted/30 p-0.5">
                        {MODE_CONFIG.map(({ id, icon: Icon, labelKey, locked }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => !locked && setMode(id)}
                                disabled={locked}
                                title={locked ? t('upload.coming_soon') : t(labelKey)}
                                className={cn(
                                    'relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    locked
                                        ? 'cursor-not-allowed opacity-35'
                                        : mode === id
                                            ? 'bg-background shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon size={15} weight={mode === id ? 'bold' : 'regular'} />
                                {locked && (
                                    <Lock size={8} className="absolute bottom-1 right-1 text-muted-foreground/60" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode content */}
                {mode === 'beauty' && (
                    selectedMasterPrompt ? (
                        <PromptConfigurator
                            masterPrompt={selectedMasterPrompt}
                            variables={promptVariables}
                            onVariablesChange={setPromptVariables}
                            onBack={handleMasterPromptBack}
                            onQuickGenerate={handleQuickGenerate}
                            language={language as SupportedLanguage}
                            t={t}
                            isCustomized={isCustomized}
                            cost={masterPromptCost}
                        />
                    ) : (
                        <StylesGallery
                            onSelect={handleStyleSelect}
                            onMasterPromptSelect={handleMasterPromptSelect}
                            selectedId={selectedStyle?.id ?? null}
                            trendStyles={trendStyles}
                            isLoadingTrends={isLoadingTrends}
                        />
                    )
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
                                <p className="text-[11px] font-medium text-primary">{batchResult.jobs.length} {t('ui.text_q39orv')}</p>
                                <p className="text-[10px] text-muted-foreground">{t('ui.text_eoo6v8')}</p>
                            </div>
                        )}
                        <BatchUploadZone onBatchComplete={handleBatchComplete} isProUser={isProUser} />
                    </div>
                )}
            </div>

            {/* ──── Sticky generate bar: mobile only, order-4 ──── */}
            {mode === 'beauty' && pendingFile && (selectedStyle || selectedMasterPrompt) && (
                <div className="order-4 md:hidden">
                    <GenerateBar
                        variant="sticky"
                        onGenerate={handleMobileGenerate}
                        isLoading={isUploading}
                        disabled={!pendingFile || (!selectedStyle && !selectedMasterPrompt) || isLimitReached}
                        isAuthenticated={isAuthenticated}
                    />
                </div>
            )}

            {/* ──── Style drawer: mobile only ──── */}
            <StyleDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onSelect={handleStyleSelect}
                onMasterPromptSelect={handleMasterPromptSelect}
                selectedId={selectedStyle?.id ?? selectedMasterPrompt?.id ?? null}
                trendStyles={trendStyles}
                isLoadingTrends={isLoadingTrends}
            />
        </div>
    );
}
