'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flower, MapPin, PencilSimple, X, Sparkle, CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { localized } from '@/i18n/config';
import { getErrorMessage } from '@/lib/utils/error';
import type { SupportedLanguage } from '@/i18n/config';
import { getDecorationsForNiche, getPlacementsForNiche } from '../data/decorations';
import type { DecorationNiche } from '../data/decorations';
import { decorationService } from '../services/decoration.service';
import type { GeneratedDecoration } from '../services/decoration.service';

interface DecorationPanelProps {
    niche: DecorationNiche;
    selectedObjects: string[];
    customText: string;
    placement: string;
    onObjectsChange: (objects: string[]) => void;
    onCustomTextChange: (text: string) => void;
    onPlacementChange: (placement: string) => void;
    language: SupportedLanguage;
    t: (key: string) => string;
}

function DecorationPanelInner({
    niche,
    selectedObjects,
    customText,
    placement,
    onObjectsChange,
    onCustomTextChange,
    onPlacementChange,
    language,
    t,
}: DecorationPanelProps): React.ReactElement {
    const decorations = useMemo(() => getDecorationsForNiche(niche), [niche]);
    const placements = useMemo(() => getPlacementsForNiche(niche), [niche]);

    const [aiSuggestions, setAiSuggestions] = useState<GeneratedDecoration[]>([]);
    const [selectedAi, setSelectedAi] = useState<Set<number>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);

    const hasSelection = selectedObjects.length > 0 || customText.trim().length > 0 || selectedAi.size > 0;

    const handleToggle = useCallback((id: string) => {
        const next = selectedObjects.includes(id)
            ? selectedObjects.filter(o => o !== id)
            : [...selectedObjects, id];
        onObjectsChange(next);
    }, [selectedObjects, onObjectsChange]);

    const handleClearAll = useCallback(() => {
        onObjectsChange([]);
        onCustomTextChange('');
        onPlacementChange('');
        setSelectedAi(new Set());
    }, [onObjectsChange, onCustomTextChange, onPlacementChange]);

    const handlePlacementSelect = useCallback((id: string) => {
        onPlacementChange(id);
    }, [onPlacementChange]);

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            const suggestions = await decorationService.suggestDecorations(niche);
            setAiSuggestions(suggestions);
            setSelectedAi(new Set());
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsGenerating(false);
        }
    }, [niche]);

    const handleAiToggle = useCallback((index: number) => {
        setSelectedAi(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    // Sync selected AI promptValues into customText after selectedAi changes
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const aiTexts = Array.from(selectedAi).map(i => aiSuggestions[i]?.promptValue).filter(Boolean);
        const manualText = customText.split(',').map(s => s.trim()).filter(s => {
            return s.length > 0 && !aiSuggestions.some(a => a.promptValue === s);
        });
        const combined = [...manualText, ...aiTexts].join(', ');
        onCustomTextChange(combined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAi]);

    return (
        <div className="flex flex-col gap-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Flower size={12} weight="fill" className="text-primary/60" />
                    <span className="text-[10px] font-semibold text-foreground/80">
                        {t('decorations.section_title')}
                    </span>
                </div>
                {hasSelection && (
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className={cn(
                            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5',
                            'text-[9px] font-medium text-muted-foreground/60',
                            'hover:text-muted-foreground hover:bg-muted/50',
                            'transition-all duration-150 active:scale-[0.96]',
                        )}
                    >
                        <X size={8} weight="bold" />
                        {t('decorations.clear_all')}
                    </button>
                )}
            </div>

            {/* Decoration chips — multi-select */}
            <div className="flex flex-wrap gap-1.5">
                {decorations.map((option) => {
                    const isSelected = selectedObjects.includes(option.id);
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleToggle(option.id)}
                            className={cn(
                                'shrink-0 rounded-full px-3 py-1.5',
                                'text-[10px] font-medium',
                                'transition-all duration-150 active:scale-[0.96]',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                isSelected
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40',
                            )}
                        >
                            {localized(option, 'label', language)}
                        </button>
                    );
                })}

                {/* Generate new ideas button */}
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={cn(
                        'shrink-0 rounded-full px-3 py-1.5',
                        'text-[10px] font-medium',
                        'border border-dashed border-primary/30',
                        'text-primary/70 bg-primary/5',
                        'hover:bg-primary/10 hover:border-primary/50',
                        'transition-all duration-150 active:scale-[0.96]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        'disabled:opacity-50 disabled:cursor-wait',
                    )}
                >
                    {isGenerating ? (
                        <CircleNotch size={12} className="animate-spin" />
                    ) : (
                        <span className="flex items-center gap-1">
                            <Sparkle size={10} weight="fill" />
                            {t('decorations.generate_ideas')}
                        </span>
                    )}
                </button>
            </div>

            {/* AI-generated suggestions */}
            {aiSuggestions.length > 0 && (
                <div className="flex flex-col gap-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                    <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                        {t('decorations.ai_suggestions')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {aiSuggestions.map((suggestion, index) => {
                            const isSelected = selectedAi.has(index);
                            const label = language === 'ka' ? suggestion.label_ka
                                : language === 'ru' ? suggestion.label_ru
                                : suggestion.label_en;
                            return (
                                <button
                                    key={`ai-${index}`}
                                    type="button"
                                    onClick={() => handleAiToggle(index)}
                                    className={cn(
                                        'shrink-0 rounded-full px-3 py-1.5',
                                        'text-[10px] font-medium',
                                        'transition-all duration-150 active:scale-[0.96]',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                        isSelected
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-primary/5 text-primary/70 hover:bg-primary/10 border border-primary/20',
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Custom text input */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                    <PencilSimple size={10} className="text-muted-foreground/50" />
                    <span className="text-[10px] font-semibold text-foreground/80">
                        {t('decorations.your_idea')}
                    </span>
                </div>
                <input
                    type="text"
                    value={customText}
                    onChange={(e) => onCustomTextChange(e.target.value)}
                    maxLength={100}
                    placeholder={t('decorations.custom_placeholder')}
                    className={cn(
                        'w-full rounded-xl px-3 py-2',
                        'bg-muted/30 border border-border/40',
                        'text-[11px] text-foreground placeholder:text-muted-foreground/40',
                        'outline-none transition-all duration-150',
                        'focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                    )}
                />
            </div>

            {/* Placement selector — only when decorations are active */}
            {hasSelection && (
                <div className="flex flex-col gap-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                    <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-muted-foreground/50" />
                        <span className="text-[10px] font-semibold text-foreground/80">
                            {t('decorations.placement_title')}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {placements.map((option) => {
                            const isSelected = placement === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handlePlacementSelect(option.id)}
                                    className={cn(
                                        'shrink-0 rounded-full px-3 py-1.5',
                                        'text-[10px] font-medium',
                                        'transition-all duration-150 active:scale-[0.96]',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                        isSelected
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40',
                                    )}
                                >
                                    {localized(option, 'label', language)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export const DecorationPanel = memo(DecorationPanelInner);
