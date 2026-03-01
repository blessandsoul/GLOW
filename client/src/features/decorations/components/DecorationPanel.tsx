'use client';

import { memo, useCallback, useMemo } from 'react';
import { Flower, MapPin, PencilSimple, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { localized } from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';
import { getDecorationsForNiche, getPlacementsForNiche } from '../data/decorations';
import type { DecorationNiche } from '../data/decorations';

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

    const hasSelection = selectedObjects.length > 0 || customText.trim().length > 0;

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
    }, [onObjectsChange, onCustomTextChange, onPlacementChange]);

    const handlePlacementSelect = useCallback((id: string) => {
        onPlacementChange(id);
    }, [onPlacementChange]);

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
            </div>

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
