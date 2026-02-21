'use client';

import { useState, useMemo } from 'react';
import { ChatText, SpinnerGap, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCaptions } from '../hooks/useCaptions';
import { LANGUAGES, DEFAULT_LANGUAGES } from '../types/caption.types';
import type { CaptionLanguage } from '../types/caption.types';
import { CaptionCard } from './CaptionCard';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface CaptionGeneratorProps {
    jobId: string;
}

export function CaptionGenerator({ jobId }: CaptionGeneratorProps): React.ReactElement {
    const { t } = useLanguage();
    const [selectedLanguages, setSelectedLanguages] = useState<CaptionLanguage[]>(DEFAULT_LANGUAGES);
    const [activeTab, setActiveTab] = useState<CaptionLanguage>(DEFAULT_LANGUAGES[0]);
    const { captions, isLoading, generate, isGenerating } = useCaptions(jobId, selectedLanguages);

    const toggleLanguage = (lang: CaptionLanguage): void => {
        setSelectedLanguages((prev) => {
            if (prev.includes(lang)) {
                if (prev.length <= 1) return prev;
                const next = prev.filter((l) => l !== lang);
                if (activeTab === lang) setActiveTab(next[0]);
                return next;
            }
            return [...prev, lang];
        });
    };

    const filteredCaptions = useMemo(
        () => captions.filter((c) => c.language === activeTab),
        [captions, activeTab],
    );

    const availableLanguages = useMemo(
        () => [...new Set(captions.map((c) => c.language))],
        [captions],
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (captions.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/50 bg-muted/20 py-12">
                <div className="rounded-full bg-primary/10 p-4">
                    <ChatText size={32} className="text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                        {t('ui.text_ia6152')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('ui.text_jt57ad')}</p>
                </div>

                {/* Language selector */}
                <div className="flex flex-wrap justify-center gap-1.5">
                    {(Object.keys(LANGUAGES) as CaptionLanguage[]).map((lang) => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                selectedLanguages.includes(lang)
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'border border-border/50 bg-background text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span>{LANGUAGES[lang].flag}</span>
                            {LANGUAGES[lang].nativeLabel}
                        </button>
                    ))}
                </div>

                <Button
                    onClick={() => generate()}
                    disabled={isGenerating || selectedLanguages.length === 0}
                    className="gap-1.5"
                >
                    {isGenerating ? (
                        <>
                            <SpinnerGap size={16} className="animate-spin" />
                            {t('ui.text_soz37f')}</>
                    ) : (
                        <>
                            <Sparkle size={16} />
                            {t('ui.text_2kgc6a')}</>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-base font-semibold text-foreground">{t('ui.text_i6ov9h')}</p>
                    <p className="text-sm text-muted-foreground">{t('ui.text_7wdrkz')}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generate()}
                    disabled={isGenerating}
                    className="gap-1.5"
                >
                    {isGenerating ? (
                        <SpinnerGap size={14} className="animate-spin" />
                    ) : (
                        <Sparkle size={14} />
                    )}
                    {t('ui.text_eey4r')}</Button>
            </div>

            {/* Language tabs */}
            {availableLanguages.length > 1 && (
                <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
                    {availableLanguages.map((lang) => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setActiveTab(lang)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                activeTab === lang
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span>{LANGUAGES[lang].flag}</span>
                            {LANGUAGES[lang].nativeLabel}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {filteredCaptions.map((caption) => (
                    <CaptionCard key={caption.id} caption={caption} />
                ))}
            </div>
        </div>
    );
}
