'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid,
    PaintBrush, MagnifyingGlass, X, Star, TrendUp, CaretDown,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';

import { StyleCard } from './StyleCard';
import { StyleScrollRow } from './StyleScrollRow';
import filtersData from '../data/filters.json';
import type { Style, FilterStyle, PresetStyle, StyleCategory } from '../types/styles.types';
import type { PhotoSettings } from '@/features/upload/types/upload.types';

const ICON_MAP: Record<string, typeof Sparkle> = {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid,
    PaintBrush, ImageSquare: Image, Orange: Flower, SmileyWink: Heart, Hoodie: TShirt,
};

const rawData = filtersData as { categories: StyleCategory[]; filters: Array<Record<string, unknown>> };

const allStyles: Style[] = rawData.filters.map((f) => {
    if (f.type === 'preset') {
        return { ...f, kind: 'preset' as const, settings: f.settings as PhotoSettings } as PresetStyle;
    }
    return { ...f, kind: 'filter' as const } as FilterStyle;
});

const categories: StyleCategory[] = rawData.categories;

const defaultExpanded = new Set(
    categories.filter((c) => c.id !== 'presets').slice(0, 2).map((c) => c.id),
);

interface StylesGalleryProps {
    onSelect: (style: Style) => void;
    selectedId: string | null;
    trendStyles?: Style[];
    isLoadingTrends?: boolean;
}

export function StylesGallery({
    onSelect,
    selectedId,
    trendStyles,
    isLoadingTrends = false,
}: StylesGalleryProps): React.ReactElement {
    const { t, language } = useLanguage();
    const isKa = language === 'ka';
    const [search, setSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(defaultExpanded);

    const popularStyles = useMemo(() => allStyles.filter((s) => s.isPopular), []);

    const nonPresetCategories = useMemo(
        () => categories.filter((c) => c.id !== 'presets'),
        [],
    );

    const stylesByCategory = useMemo(() => {
        const map = new Map<string, Style[]>();
        for (const style of allStyles) {
            const list = map.get(style.categoryId) ?? [];
            list.push(style);
            map.set(style.categoryId, list);
        }
        return map;
    }, []);

    const searchResults = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return [];
        return allStyles.filter(
            (s) => s.name_ka.toLowerCase().includes(q) || s.name_ru.toLowerCase().includes(q),
        );
    }, [search]);

    const isSearching = search.trim().length > 0;

    const handleSelect = useCallback((style: Style) => { onSelect(style); }, [onSelect]);

    const toggleCategory = useCallback((catId: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(catId)) {
                next.delete(catId);
            } else {
                next.add(catId);
            }
            return next;
        });
    }, []);

    const getCategoryIcon = (iconName: string): typeof Sparkle => {
        return ICON_MAP[iconName] ?? Sparkle;
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Search bar */}
            <div className="relative">
                <MagnifyingGlass
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('upload.styles_search_placeholder')}
                    className={cn(
                        'w-full rounded-lg border border-border/40 bg-muted/20 py-1.5 pl-8 pr-8 text-[11px] text-foreground',
                        'placeholder:text-muted-foreground/60',
                        'focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20',
                        'transition-colors duration-150',
                    )}
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                    >
                        <X size={11} />
                    </button>
                )}
            </div>

            {/* Search results */}
            {isSearching && (
                <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-muted-foreground">
                        {searchResults.length} {isKa ? 'შედეგი' : 'results'}
                    </p>
                    {searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
                            <MagnifyingGlass size={20} className="text-muted-foreground/40" />
                            <p className="text-[11px] text-muted-foreground">
                                {t('upload.styles_no_results')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {searchResults.map((style) => (
                                <StyleCard
                                    key={style.id}
                                    style={style}
                                    isSelected={selectedId === style.id}
                                    onSelect={handleSelect}
                                    language={language}
                                    size="md"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Browse mode (not searching) */}
            {!isSearching && (
                <>
                    {/* Popular section */}
                    {popularStyles.length > 0 && (
                        <StyleScrollRow
                            title={t('upload.styles_popular')}
                            icon={<Star size={13} className="text-warning" weight="fill" />}
                            styles={popularStyles}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            language={language}
                        />
                    )}

                    {/* New This Week section */}
                    {(trendStyles && trendStyles.length > 0 || isLoadingTrends) && (
                        <StyleScrollRow
                            title={t('upload.styles_new_this_week')}
                            icon={<TrendUp size={13} className="text-success" weight="bold" />}
                            styles={trendStyles ?? []}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            language={language}
                            isLoading={isLoadingTrends}
                        />
                    )}

                    {/* Category accordion sections */}
                    <div className="flex flex-col gap-1">
                        {nonPresetCategories.map((cat) => {
                            const Icon = getCategoryIcon(cat.icon);
                            const isExpanded = expandedCategories.has(cat.id);
                            const catStyles = stylesByCategory.get(cat.id) ?? [];

                            return (
                                <div key={cat.id}>
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className={cn(
                                            'flex w-full items-center gap-2 py-2 text-left text-[11px] font-medium text-foreground',
                                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded',
                                        )}
                                    >
                                        <Icon size={14} weight={isExpanded ? 'fill' : 'regular'} />
                                        <span className="flex-1 truncate">
                                            {isKa ? cat.label_ka : cat.label_ru}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground tabular-nums">
                                            {cat.count}
                                        </span>
                                        <CaretDown
                                            size={12}
                                            className={cn(
                                                'text-muted-foreground transition-transform duration-200',
                                                isExpanded && 'rotate-180',
                                            )}
                                        />
                                    </button>

                                    {isExpanded && catStyles.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                                            {catStyles.map((style) => (
                                                <StyleCard
                                                    key={style.id}
                                                    style={style}
                                                    isSelected={selectedId === style.id}
                                                    onSelect={handleSelect}
                                                    language={language}
                                                    size="md"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
