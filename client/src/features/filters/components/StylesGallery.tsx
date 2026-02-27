'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import NextImage from 'next/image';
import {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid,
    PaintBrush, MagnifyingGlass, X, TrendUp, CaretDown, MagicWand as Wand2,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { localized } from '@/i18n/config';
import { useDebounce } from '@/hooks/useDebounce';

import { StyleCard } from './StyleCard';
import { StyleScrollRow } from './StyleScrollRow';
import filtersData from '../data/filters.json';
import type { Style, FilterStyle, PresetStyle, StyleCategory, StyleSubcategory, MasterPrompt } from '../types/styles.types';
import type { PhotoSettings } from '@/features/upload/types/upload.types';

const ICON_MAP: Record<string, typeof Sparkle> = {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid,
    PaintBrush, Wand2, ImageSquare: Image, Orange: Flower, SmileyWink: Heart, Hoodie: TShirt,
};

const INITIAL_VISIBLE = 9;
const SEARCH_INITIAL_VISIBLE = 12;
const SUB_INITIAL_VISIBLE = 6;

// Lazy-parsed: only computed once on first access, not at module load
let _allStyles: Style[] | null = null;
let _categories: StyleCategory[] | null = null;
let _subcategories: StyleSubcategory[] | null = null;
let _masterPrompts: MasterPrompt[] | null = null;

function getAllStyles(): Style[] {
    if (!_allStyles) {
        const rawData = filtersData as { categories: StyleCategory[]; subcategories: StyleSubcategory[]; filters: Array<Record<string, unknown>> };
        _allStyles = rawData.filters.map((f) => {
            if (f.type === 'preset') {
                return { ...f, kind: 'preset' as const, settings: f.settings as PhotoSettings } as PresetStyle;
            }
            return { ...f, kind: 'filter' as const } as FilterStyle;
        });
    }
    return _allStyles;
}

function getCategories(): StyleCategory[] {
    if (!_categories) {
        const rawData = filtersData as { categories: StyleCategory[]; subcategories: StyleSubcategory[]; filters: Array<Record<string, unknown>> };
        _categories = rawData.categories;
    }
    return _categories;
}

function getSubcategories(): StyleSubcategory[] {
    if (!_subcategories) {
        const rawData = filtersData as { categories: StyleCategory[]; subcategories: StyleSubcategory[]; filters: Array<Record<string, unknown>> };
        _subcategories = rawData.subcategories ?? [];
    }
    return _subcategories;
}

function getMasterPrompts(): MasterPrompt[] {
    if (!_masterPrompts) {
        const rawData = filtersData as { masterPrompts?: MasterPrompt[] };
        _masterPrompts = rawData.masterPrompts ?? [];
    }
    return _masterPrompts;
}

function getDefaultExpanded(): Set<string> {
    const cats = getCategories();
    return new Set(cats.map((c) => c.id));
}

function getCategoryIcon(iconName: string): typeof Sparkle {
    return ICON_MAP[iconName] ?? Sparkle;
}

interface StylesGalleryProps {
    onSelect: (style: Style) => void;
    onMasterPromptSelect?: (mp: MasterPrompt) => void;
    selectedId: string | null;
    trendStyles?: Style[];
    isLoadingTrends?: boolean;
}

export function StylesGallery({
    onSelect,
    onMasterPromptSelect,
    selectedId,
    trendStyles,
    isLoadingTrends = false,
}: StylesGalleryProps): React.ReactElement {
    const { t, language } = useLanguage();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 250);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => getDefaultExpanded());
    const [showAllMap, setShowAllMap] = useState<Record<string, boolean>>({});
    const [showAllSearch, setShowAllSearch] = useState(false);

    useEffect(() => { setShowAllSearch(false); }, [debouncedSearch]);

    const allStyles = useMemo(() => getAllStyles(), []);
    const categories = useMemo(() => getCategories(), []);
    const subcategories = useMemo(() => getSubcategories(), []);
    const masterPrompts = useMemo(() => getMasterPrompts(), []);

    const masterPromptsByCategory = useMemo(() => {
        const map = new Map<string, MasterPrompt[]>();
        for (const mp of masterPrompts) {
            const list = map.get(mp.categoryId) ?? [];
            list.push(mp);
            map.set(mp.categoryId, list);
        }
        return map;
    }, [masterPrompts]);

    const nonPresetCategories = useMemo(
        () => categories,
        [categories],
    );

    // Subcategories grouped by parent category
    const subcategoriesByCategory = useMemo(() => {
        const map = new Map<string, StyleSubcategory[]>();
        for (const sub of subcategories) {
            const list = map.get(sub.categoryId) ?? [];
            list.push(sub);
            map.set(sub.categoryId, list);
        }
        // Sort by sortOrder within each category
        for (const [key, subs] of map) {
            map.set(key, subs.sort((a, b) => a.sortOrder - b.sortOrder));
        }
        return map;
    }, [subcategories]);

    // Styles grouped by category (for categories without subcategories)
    const stylesByCategory = useMemo(() => {
        const map = new Map<string, Style[]>();
        for (const style of allStyles) {
            const list = map.get(style.categoryId) ?? [];
            list.push(style);
            map.set(style.categoryId, list);
        }
        return map;
    }, [allStyles]);

    // Styles grouped by subcategory
    const stylesBySubcategory = useMemo(() => {
        const map = new Map<string, Style[]>();
        for (const style of allStyles) {
            if (!style.subcategoryId) continue;
            const list = map.get(style.subcategoryId) ?? [];
            list.push(style);
            map.set(style.subcategoryId, list);
        }
        return map;
    }, [allStyles]);

    const searchResults = useMemo(() => {
        const q = debouncedSearch.toLowerCase().trim();
        if (!q) return [];
        return allStyles.filter(
            (s) => s.name_ka.toLowerCase().includes(q) || s.name_ru.toLowerCase().includes(q) || s.name_en.toLowerCase().includes(q),
        );
    }, [debouncedSearch, allStyles]);

    const isSearching = debouncedSearch.trim().length > 0;

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

    const toggleShowAll = useCallback((key: string) => {
        setShowAllMap((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

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
                        {searchResults.length} {t('dashboard.results_count')}
                    </p>
                    {searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
                            <MagnifyingGlass size={20} className="text-muted-foreground/40" />
                            <p className="text-[11px] text-muted-foreground">
                                {t('upload.styles_no_results')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-1.5">
                                {(showAllSearch ? searchResults : searchResults.slice(0, SEARCH_INITIAL_VISIBLE)).map((style) => (
                                    <StyleCard
                                        key={style.id}
                                        style={style}
                                        isSelected={selectedId === style.id}
                                        onSelect={handleSelect}
                                        language={language}
                                        size="sm"
                                    />
                                ))}
                            </div>
                            {searchResults.length > SEARCH_INITIAL_VISIBLE && !showAllSearch && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllSearch(true)}
                                    className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] font-medium text-primary transition-colors duration-150 hover:text-primary/80"
                                >
                                    {t('upload.show_more')} ({searchResults.length - SEARCH_INITIAL_VISIBLE})
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Browse mode (not searching) */}
            {!isSearching && (
                <>
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
                    <div className="flex flex-col gap-2">
                        {nonPresetCategories.map((cat) => {
                            const Icon = getCategoryIcon(cat.icon);
                            const isExpanded = expandedCategories.has(cat.id);
                            const catStyles = stylesByCategory.get(cat.id) ?? [];
                            const catMasterPrompts = masterPromptsByCategory.get(cat.id) ?? [];
                            const catSubcategories = subcategoriesByCategory.get(cat.id);
                            const hasSubcategories = catSubcategories && catSubcategories.length > 0;
                            const hasCover = !!cat.coverUrl;

                            return (
                                <div key={cat.id}>
                                    {/* Accordion header — cover variant or plain */}
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className={cn(
                                            'flex w-full items-center text-left transition-all duration-200',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                            hasCover
                                                ? 'relative overflow-hidden rounded-xl h-[56px]'
                                                : 'gap-2 py-2 text-[11px] font-medium text-foreground rounded',
                                        )}
                                    >
                                        {hasCover ? (
                                            <>
                                                <NextImage
                                                    src={cat.coverUrl!}
                                                    alt={localized(cat, 'label', language)}
                                                    fill
                                                    sizes="400px"
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
                                                <div className="relative z-10 flex w-full items-center justify-between px-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[12px] font-bold tracking-widest text-white/95">
                                                            {localized(cat, 'label', language)}
                                                        </span>
                                                        <span className="text-[9px] font-medium text-white/50 tabular-nums">
                                                            {cat.count} looks
                                                        </span>
                                                    </div>
                                                    <CaretDown
                                                        size={14}
                                                        weight="bold"
                                                        className={cn(
                                                            'text-white/60 transition-transform duration-200',
                                                            isExpanded && 'rotate-180',
                                                        )}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Icon size={14} weight={isExpanded ? 'fill' : 'regular'} />
                                                <span className="flex-1 truncate">
                                                    {localized(cat, 'label', language)}
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
                                            </>
                                        )}
                                    </button>

                                    {/* Expanded content */}
                                    {(catStyles.length > 0 || catMasterPrompts.length > 0) && (
                                        <div
                                            className={cn(
                                                'grid transition-[grid-template-rows] duration-300 ease-out',
                                                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                {catMasterPrompts.length > 0 ? (
                                                    /* Master prompt cards (e.g., Retouch category) */
                                                    <div className={cn('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-1.5 pb-2', hasCover && 'mt-2')}>
                                                        {catMasterPrompts.map((mp) => {
                                                            const mpName = localized(mp, 'name', language);
                                                            const mpDesc = localized(mp, 'description', language);
                                                            const isSelected = selectedId === mp.id;
                                                            return (
                                                                <div
                                                                    key={mp.id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => onMasterPromptSelect?.(mp)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMasterPromptSelect?.(mp); } }}
                                                                    className={cn(
                                                                        'group relative w-full overflow-hidden rounded-lg transition-all duration-200',
                                                                        'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
                                                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                                                        isSelected ? 'border-2 border-primary' : 'border border-border/40',
                                                                    )}
                                                                >
                                                                    <div className="relative aspect-[3/4] w-full">
                                                                        {mp.previewUrl ? (
                                                                            <NextImage
                                                                                src={mp.previewUrl}
                                                                                alt={mpName}
                                                                                fill
                                                                                sizes="(max-width: 640px) 30vw, 20vw"
                                                                                className="object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/5 to-primary/10">
                                                                                <Sparkle size={16} className="text-primary/30" weight="fill" />
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-5">
                                                                            <p className="truncate text-[9px] font-semibold text-white">{mpName}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : hasSubcategories ? (
                                                    /* Subcategory sections within this pack */
                                                    <div className={cn('flex flex-col gap-3', hasCover && 'mt-2', 'pb-2')}>
                                                        {catSubcategories.map((sub) => {
                                                            const SubIcon = getCategoryIcon(sub.icon);
                                                            const subStyles = stylesBySubcategory.get(sub.id) ?? [];
                                                            const showAllSub = showAllMap[sub.id] ?? false;
                                                            const visibleSubStyles = showAllSub ? subStyles : subStyles.slice(0, SUB_INITIAL_VISIBLE);

                                                            if (subStyles.length === 0) return null;

                                                            return (
                                                                <div key={sub.id} className="flex flex-col gap-1.5">
                                                                    {/* Subcategory header */}
                                                                    <div className="flex items-center gap-1.5 px-0.5">
                                                                        <SubIcon size={12} className="text-muted-foreground" />
                                                                        <span className="text-[10px] font-semibold text-foreground/80">
                                                                            {localized(sub, 'label', language)}
                                                                        </span>
                                                                        <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                                                                            {sub.count}
                                                                        </span>
                                                                    </div>
                                                                    {/* Subcategory grid */}
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-1.5">
                                                                        {visibleSubStyles.map((style) => (
                                                                            <StyleCard
                                                                                key={style.id}
                                                                                style={style}
                                                                                isSelected={selectedId === style.id}
                                                                                onSelect={handleSelect}
                                                                                language={language}
                                                                                size="sm"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    {subStyles.length > SUB_INITIAL_VISIBLE && !showAllSub && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleShowAll(sub.id)}
                                                                            className="flex items-center justify-center gap-1 w-full py-1 text-[10px] font-medium text-primary transition-colors duration-150 hover:text-primary/80"
                                                                        >
                                                                            {t('upload.show_more')} ({subStyles.length - SUB_INITIAL_VISIBLE})
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* Flat grid — no subcategories (e.g., Obsidian) */
                                                    <>
                                                        <div className={cn('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-1.5 pb-2', hasCover && 'mt-2')}>
                                                            {(showAllMap[cat.id] ? catStyles : catStyles.slice(0, INITIAL_VISIBLE)).map((style) => (
                                                                <StyleCard
                                                                    key={style.id}
                                                                    style={style}
                                                                    isSelected={selectedId === style.id}
                                                                    onSelect={handleSelect}
                                                                    language={language}
                                                                    size="sm"
                                                                />
                                                            ))}
                                                        </div>
                                                        {catStyles.length > INITIAL_VISIBLE && !showAllMap[cat.id] && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleShowAll(cat.id)}
                                                                className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] font-medium text-primary transition-colors duration-150 hover:text-primary/80"
                                                            >
                                                                {t('upload.show_more')} ({catStyles.length - INITIAL_VISIBLE})
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
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
