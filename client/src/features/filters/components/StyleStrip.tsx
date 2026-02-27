'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { DotsNine, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { Style, StyleCategory } from '../types/styles.types';
import type { SupportedLanguage } from '@/i18n/config';

interface StyleStripProps {
    categories: StyleCategory[];
    stylesByCategory: Record<string, Style[]>;
    selectedId: string | null;
    onSelect: (style: Style) => void;
    onBrowseAll: () => void;
    language: SupportedLanguage;
}

const PLACEHOLDER_URL = '/filters/placeholder.svg';

function StyleStripInner({
    categories,
    stylesByCategory,
    selectedId,
    onSelect,
    onBrowseAll,
    language,
}: StyleStripProps): React.ReactElement {
    const { t } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isKa = language === 'ka';

    // Auto-select first category
    const [activePackId, setActivePackId] = useState<string>(
        () => categories[0]?.id ?? '',
    );

    const activeStyles = stylesByCategory[activePackId] ?? [];
    const hasSelection = selectedId !== null;

    // Reset scroll position when pack changes
    const handlePackChange = useCallback((packId: string) => {
        setActivePackId(packId);
        scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }, []);

    // Auto-scroll to selected style within the active pack
    useEffect(() => {
        if (!selectedId || !scrollRef.current) return;
        const el = scrollRef.current.querySelector(`[data-style-id="${selectedId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedId]);

    return (
        <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center justify-between px-5">
                <div className="flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                        {t('upload.style_title')}
                    </span>
                </div>
                {!hasSelection && (
                    <span className="text-[11px] text-primary animate-pulse">
                        {t('upload.style_subtitle')}
                    </span>
                )}
            </div>

            {/* Pack tabs */}
            {categories.length > 0 && (
                <div
                    className={cn(
                        'flex gap-2 overflow-x-auto px-5',
                        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    )}
                >
                    {categories.map((cat) => {
                        const isActive = cat.id === activePackId;
                        const label = isKa ? cat.label_ka : cat.label_ru;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handlePackChange(cat.id)}
                                className={cn(
                                    'shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5',
                                    'text-[11px] font-semibold transition-all duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    'active:scale-[0.96]',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                                )}
                            >
                                {cat.coverUrl && (
                                    <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                                        <Image
                                            src={cat.coverUrl}
                                            alt=""
                                            fill
                                            sizes="16px"
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                {label}
                                <span className={cn(
                                    'text-[9px] tabular-nums',
                                    isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60',
                                )}>
                                    {cat.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Swipable style cards for active pack */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    className={cn(
                        'flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-pl-5',
                        'px-5 pb-3 pt-0.5',
                        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    )}
                >
                    {/* Browse All button */}
                            <button
                                type="button"
                                onClick={onBrowseAll}
                                aria-label={t('ui.text_m7k2')}
                                className={cn(
                                    'w-[72px] shrink-0 snap-start flex flex-col items-center gap-1',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-[96px] w-full items-center justify-center rounded-xl',
                                        'bg-primary/10 border border-primary/20',
                                        'transition-all duration-200 hover:bg-primary/15 active:scale-[0.96]',
                                    )}
                                >
                                    <DotsNine size={24} className="text-primary" weight="fill" />
                                </div>
                                <span className="text-[10px] font-medium text-center text-primary leading-tight">
                                    {t('ui.text_m7k2')}
                                </span>
                            </button>

                            {/* Style cards for selected pack */}
                            {activeStyles.map((style) => {
                                const isSelected = selectedId === style.id;
                                const name = isKa ? style.name_ka : style.name_ru;
                                const isPlaceholder = style.previewUrl === PLACEHOLDER_URL;

                                return (
                                    <button
                                        key={style.id}
                                        type="button"
                                        data-style-id={style.id}
                                        onClick={() => onSelect(style)}
                                        aria-label={name}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            'w-[72px] shrink-0 snap-start flex flex-col items-center gap-1',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'h-[96px] w-full rounded-xl overflow-hidden relative',
                                                'transition-all duration-200 active:scale-[0.96]',
                                                isSelected
                                                    ? 'ring-2 ring-primary ring-offset-2 shadow-md shadow-primary/20'
                                                    : 'ring-1 ring-border/50',
                                            )}
                                        >
                                            {isPlaceholder ? (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
                                                    <Sparkle size={18} className="text-primary/30" weight="fill" />
                                                </div>
                                            ) : (
                                                <Image
                                                    src={style.previewUrl}
                                                    alt={name}
                                                    fill
                                                    sizes="72px"
                                                    className="object-cover"
                                                />
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5">
                                                    <span className="block text-[8px] font-bold text-center text-primary-foreground">
                                                        ✓
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                'text-[10px] text-center truncate w-full leading-tight px-0.5',
                                                isSelected
                                                    ? 'font-semibold text-primary'
                                                    : 'font-medium text-muted-foreground',
                                            )}
                                        >
                                            {name}
                                        </span>
                                    </button>
                                );
                            })}
                </div>

                {/* Right fade gradient */}
                <div
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute right-0 top-0 h-full w-10',
                        'bg-gradient-to-l from-background to-transparent',
                    )}
                />
            </div>
        </div>
    );
}

export const StyleStrip = memo(StyleStripInner);
