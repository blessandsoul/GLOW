'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid,
    PaintBrush, FunnelSimple, MagnifyingGlass, Check, Copy, X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import filtersData from '../data/filters.json';
import type { Filter, FilterCategory, FiltersData } from '../types/filters.types';

const data = filtersData as FiltersData;

const ICON_MAP: Record<string, typeof Sparkle> = {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid,
    PaintBrush, ImageSquare: Image, Orange: Flower, SmileyWink: Heart, Hoodie: TShirt,
};

const ALL_ID = 'all';

interface FiltersPanelProps {
    onSelect: (filter: Filter) => void;
    selectedId: string | null;
}

export function FiltersPanel({ onSelect, selectedId }: FiltersPanelProps): React.ReactElement {
    const { t, language } = useLanguage();
    const [activeCategory, setActiveCategory] = useState(ALL_ID);
    const [search, setSearch] = useState('');
    const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const isKa = language === 'ka';

    const categories = useMemo(() => data.categories, []);
    const allFilters = useMemo(() => data.filters, []);

    const filtered = useMemo(() => {
        let list = allFilters;

        if (activeCategory !== ALL_ID) {
            list = list.filter((f) => f.categoryId === activeCategory);
        }

        if (search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(
                (f) =>
                    f.name_ka.toLowerCase().includes(q) ||
                    f.name_ru.toLowerCase().includes(q) ||
                    f.prompt.toLowerCase().includes(q),
            );
        }

        return list;
    }, [allFilters, activeCategory, search]);

    const handleSelect = useCallback(
        (filter: Filter) => {
            onSelect(filter);
        },
        [onSelect],
    );

    const handleCopy = useCallback(async (prompt: string, filterId: string) => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(filterId);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Fallback - ignore
        }
    }, []);

    const getCategoryIcon = (iconName: string): typeof Sparkle => {
        return ICON_MAP[iconName] ?? Sparkle;
    };

    const getCategoryLabel = (cat: FilterCategory): string => {
        return isKa ? cat.label_ka : cat.label_ru;
    };

    const getFilterName = (f: Filter): string => {
        return isKa ? f.name_ka : f.name_ru;
    };

    return (
        <div className="flex flex-col gap-2.5">

            {/* Search */}
            <div className="relative">
                <MagnifyingGlass
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isKa ? 'ფილტრის ძებნა...' : 'Поиск фильтра...'}
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
                    >
                        <X size={11} />
                    </button>
                )}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-1">
                <button
                    type="button"
                    onClick={() => setActiveCategory(ALL_ID)}
                    className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
                        activeCategory === ALL_ID
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                >
                    <FunnelSimple size={10} />
                    {isKa ? 'ყველა' : 'Все'}
                    <span className="tabular-nums opacity-60">{allFilters.length}</span>
                </button>
                {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon);
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
                                activeCategory === cat.id
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                            )}
                        >
                            <Icon size={10} weight={activeCategory === cat.id ? 'fill' : 'regular'} />
                            {getCategoryLabel(cat)}
                            <span className="tabular-nums opacity-60">{cat.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Results count */}
            <p className="text-[10px] text-muted-foreground">
                {isKa
                    ? `ნაპოვნია ${filtered.length} ფილტრი`
                    : `Найдено ${filtered.length} фильтров`}
            </p>

            {/* Filters list */}
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto [scrollbar-width:thin] pr-0.5">
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
                        <MagnifyingGlass size={20} className="text-muted-foreground/40" />
                        <p className="text-[11px] text-muted-foreground">
                            {isKa ? 'ფილტრი ვერ მოიძებნა' : 'Фильтры не найдены'}
                        </p>
                    </div>
                )}

                {filtered.map((filter) => {
                    const isSelected = selectedId === filter.id;
                    const isExpanded = expandedFilter === filter.id;
                    const isCopied = copied === filter.id;

                    return (
                        <div
                            key={filter.id}
                            className={cn(
                                'group rounded-lg border transition-all duration-150',
                                isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border/30 hover:border-primary/30 hover:bg-muted/30',
                            )}
                        >
                            {/* Filter header — click to select */}
                            <button
                                type="button"
                                onClick={() => handleSelect(filter)}
                                className={cn(
                                    'flex w-full items-center gap-2 px-2.5 py-2 text-left',
                                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:rounded-lg',
                                )}
                            >
                                {/* Selected indicator */}
                                <div
                                    className={cn(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150',
                                        isSelected
                                            ? 'border-primary bg-primary'
                                            : 'border-border/60 group-hover:border-primary/40',
                                    )}
                                >
                                    {isSelected && <Check size={9} className="text-primary-foreground" weight="bold" />}
                                </div>

                                {/* Name */}
                                <span
                                    className={cn(
                                        'flex-1 truncate text-[11px] font-medium transition-colors duration-100',
                                        isSelected ? 'text-primary' : 'text-foreground',
                                    )}
                                >
                                    {getFilterName(filter)}
                                </span>

                                {/* Expand toggle */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedFilter(isExpanded ? null : filter.id);
                                    }}
                                    className={cn(
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all duration-150',
                                        'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                    title={isKa ? 'პრომპტის ნახვა' : 'Показать промпт'}
                                >
                                    <Copy size={10} />
                                </button>
                            </button>

                            {/* Expanded prompt preview */}
                            {isExpanded && (
                                <div className="border-t border-border/20 px-2.5 pb-2 pt-1.5">
                                    <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap text-[10px] leading-relaxed text-muted-foreground [scrollbar-width:thin]">
                                        {filter.prompt.substring(0, 500)}
                                        {filter.prompt.length > 500 ? '...' : ''}
                                    </pre>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(filter.prompt, filter.id)}
                                        className={cn(
                                            'mt-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-150',
                                            isCopied
                                                ? 'bg-green-500/10 text-green-600'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check size={10} />
                                                {isKa ? 'დაკოპირდა' : 'Скопировано'}
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={10} />
                                                {isKa ? 'კოპირება' : 'Копировать'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
