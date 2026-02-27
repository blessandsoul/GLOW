'use client';

import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
    DotsNine, Sparkle, Package, MagicWand, Flower, Images, TShirt,
    Image as ImageIcon, Eye, Play, Camera, Heart, HandPalm, PenNib,
    Hand, Scissors, FirstAid, PaintBrush, ArrowLeft, CaretRight,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { Style, StyleCategory, StyleSubcategory, MasterPrompt } from '../types/styles.types';
import { localized } from '@/i18n/config';
import type { SupportedLanguage } from '@/i18n/config';

const ICON_MAP: Record<string, typeof Sparkle> = {
    Sparkle, Package, MagicWand, Flower, Images, TShirt, Image: ImageIcon, Eye,
    Play, Camera, Heart, HandPalm, PenNib, Hand, Scissors, FirstAid, PaintBrush,
    Wand2: MagicWand,
};

interface StyleStripProps {
    categories: StyleCategory[];
    subcategories: StyleSubcategory[];
    stylesByCategory: Record<string, Style[]>;
    stylesBySubcategory: Record<string, Style[]>;
    masterPromptsByCategory?: Record<string, MasterPrompt[]>;
    selectedId: string | null;
    onSelect: (style: Style) => void;
    onMasterPromptSelect?: (mp: MasterPrompt) => void;
    onBrowseAll: () => void;
    language: SupportedLanguage;
}

const PLACEHOLDER_URL = '/filters/placeholder.svg';

function StyleStripInner({
    categories,
    subcategories,
    stylesByCategory,
    stylesBySubcategory,
    masterPromptsByCategory,
    selectedId,
    onSelect,
    onMasterPromptSelect,
    onBrowseAll,
    language,
}: StyleStripProps): React.ReactElement {
    const { t } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [activePackId, setActivePackId] = useState<string>(
        () => categories[0]?.id ?? '',
    );
    // null = showing category cards, string = drilled into a subcategory
    const [activeSubId, setActiveSubId] = useState<string | null>(null);

    const packSubcategories = useMemo(
        () => subcategories
            .filter((s) => s.categoryId === activePackId)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        [subcategories, activePackId],
    );
    const hasSubcategories = packSubcategories.length > 0;

    // Master prompts for the active pack
    const activeMasterPrompts = useMemo(
        () => masterPromptsByCategory?.[activePackId] ?? [],
        [masterPromptsByCategory, activePackId],
    );
    const hasMasterPrompts = activeMasterPrompts.length > 0;

    // When drilled into a subcategory — show its filters
    const activeStyles = useMemo(() => {
        // If pack has master prompts, don't show regular styles in strip
        if (hasMasterPrompts) return [];
        if (activeSubId) {
            return stylesBySubcategory[activeSubId] ?? [];
        }
        // No subcategories (e.g. Obsidian) — show all pack filters
        if (!hasSubcategories) {
            return stylesByCategory[activePackId] ?? [];
        }
        // Has subcategories but none selected — category cards mode, no style cards
        return [];
    }, [activeSubId, hasSubcategories, hasMasterPrompts, stylesBySubcategory, stylesByCategory, activePackId]);

    const activeSubLabel = useMemo(() => {
        if (!activeSubId) return null;
        const sub = packSubcategories.find((s) => s.id === activeSubId);
        if (!sub) return null;
        return localized(sub, 'label', language);
    }, [activeSubId, packSubcategories, language]);

    const hasSelection = selectedId !== null;

    const handlePackChange = useCallback((packId: string) => {
        setActivePackId(packId);
        setActiveSubId(null);
        scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }, []);

    const handleSubOpen = useCallback((subId: string) => {
        setActiveSubId(subId);
        scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }, []);

    const handleSubBack = useCallback(() => {
        setActiveSubId(null);
        scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!selectedId || !scrollRef.current) return;
        const el = scrollRef.current.querySelector(`[data-style-id="${selectedId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedId]);


    // Are we in "category picker" mode? (pack has subcategories and none is selected)
    // Master prompts override subcategory cards
    const showCategoryCards = !hasMasterPrompts && hasSubcategories && activeSubId === null;

    // ── Scroll hint state ──
    const [scrollMeta, setScrollMeta] = useState({ canScrollRight: false, hiddenCount: 0, totalPages: 1, currentPage: 0 });

    const [showPulsingArrow, setShowPulsingArrow] = useState(true);

    // Track scroll position for hints
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const update = (): void => {
            const maxScroll = el.scrollWidth - el.clientWidth;
            const canRight = maxScroll > 10 && el.scrollLeft < maxScroll - 10;
            const containerRight = el.getBoundingClientRect().right;
            const cards = el.querySelectorAll<HTMLElement>('[data-card]');
            let hidden = 0;
            cards.forEach((card) => {
                if (card.getBoundingClientRect().left >= containerRight - 20) hidden++;
            });
            const cardWidth = 72 + 10; // card w-[72px] + gap-2.5 (10px)
            const totalCards = cards.length;
            const visibleCards = Math.floor(el.clientWidth / cardWidth);
            const pages = Math.max(1, Math.ceil(totalCards / Math.max(1, visibleCards)));
            const current = maxScroll > 0
                ? Math.min(pages - 1, Math.round((el.scrollLeft / maxScroll) * (pages - 1)))
                : 0;
            setScrollMeta({ canScrollRight: canRight, hiddenCount: hidden, totalPages: pages, currentPage: current });

        };
        update();
        el.addEventListener('scroll', update, { passive: true });
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return (): void => { el.removeEventListener('scroll', update); ro.disconnect(); };
    }, [activePackId, activeSubId]);

    // Reset hints on content change
    useEffect(() => {
        setShowPulsingArrow(true);
        const timer = setTimeout(() => setShowPulsingArrow(false), 3000);
        return (): void => { clearTimeout(timer); };
    }, [activePackId, activeSubId]);

    return (
        <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center justify-between px-5">
                <div className="flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                        {t('upload.style_label')}
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
                        const label = localized(cat, 'label', language);
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

            {/* Subcategory breadcrumb — when drilled into a subcategory */}
            {activeSubId && activeSubLabel && (
                <div className="flex items-center gap-1.5 px-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-150">
                    <button
                        type="button"
                        onClick={handleSubBack}
                        className={cn(
                            'flex items-center gap-1 rounded-full px-2.5 py-1',
                            'text-[10px] font-medium text-primary',
                            'bg-primary/8 hover:bg-primary/12',
                            'transition-all duration-150 active:scale-[0.96]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        )}
                    >
                        <ArrowLeft size={11} weight="bold" />
                        {t('upload.filter_all') || 'All'}
                    </button>
                    <span className="text-[11px] font-semibold text-foreground">
                        {activeSubLabel}
                    </span>
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                        {activeStyles.length}
                    </span>
                </div>
            )}

            {/* Scrollable area — category cards OR filter cards */}
            <div className="relative overflow-hidden">
                <div
                    key={showCategoryCards ? 'categories' : `sub-${activeSubId ?? 'flat'}`}
                    ref={scrollRef}
                    className={cn(
                        'flex gap-2.5 overflow-x-auto snap-x snap-proximity scroll-pl-5',
                        'px-5 pb-3 pt-2',
                        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
                        showCategoryCards
                            ? 'motion-safe:slide-in-from-left-4'
                            : 'motion-safe:slide-in-from-right-4',
                    )}
                >
                    {/* Browse All button — always first */}
                    <button
                        type="button"
                        data-card
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

                    {/* Category cards — big tappable buttons for each subcategory */}
                    {showCategoryCards && packSubcategories.map((sub) => {
                        const SubIcon = ICON_MAP[sub.icon] ?? Sparkle;
                        const label = localized(sub, 'label', language);
                        return (
                            <button
                                key={sub.id}
                                type="button"
                                data-card
                                onClick={() => handleSubOpen(sub.id)}
                                className={cn(
                                    'w-[72px] shrink-0 snap-start flex flex-col items-center gap-1',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-[96px] w-full flex-col items-center justify-center gap-1.5 rounded-xl',
                                        'bg-muted/40 border border-border/40',
                                        'transition-all duration-200 hover:bg-muted/60 hover:border-border/60 active:scale-[0.96]',
                                    )}
                                >
                                    <SubIcon size={22} className="text-foreground/70" weight="duotone" />
                                    <span className="text-[9px] font-medium text-muted-foreground tabular-nums">
                                        {sub.count}
                                    </span>
                                </div>
                                <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight truncate w-full px-0.5">
                                    {label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Master prompt cards — shown for packs with master prompts (e.g., Retouch) */}
                    {hasMasterPrompts && activeMasterPrompts.map((mp) => {
                        const isSelected = selectedId === mp.id;
                        const name = localized(mp, 'name', language);

                        return (
                            <button
                                key={mp.id}
                                type="button"
                                data-card
                                data-style-id={mp.id}
                                onClick={() => onMasterPromptSelect?.(mp)}
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
                                    {mp.previewUrl ? (
                                        <Image
                                            src={mp.previewUrl}
                                            alt={name}
                                            fill
                                            sizes="72px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
                                            <Sparkle size={18} className="text-primary/30" weight="fill" />
                                        </div>
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

                    {/* Style/filter cards — shown for flat packs or when drilled into a subcategory */}
                    {!showCategoryCards && !hasMasterPrompts && activeStyles.map((style) => {
                        const isSelected = selectedId === style.id;
                        const name = localized(style, 'name', language);
                        const isPlaceholder = style.previewUrl === PLACEHOLDER_URL;

                        return (
                            <button
                                key={style.id}
                                type="button"
                                data-card
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

                {/* ═══ HINT 1: Pulsing arrow on right edge ═══ */}
                {scrollMeta.canScrollRight && showPulsingArrow && (
                    <div
                        aria-hidden
                        className={cn(
                            'absolute right-1.5 top-1/2 -translate-y-1/2 z-10',
                            'flex h-7 w-7 items-center justify-center rounded-full',
                            'bg-background/80 shadow-sm border border-border/40',
                            'motion-safe:animate-pulse',
                        )}
                    >
                        <CaretRight size={14} weight="bold" className="text-foreground/60" />
                    </div>
                )}

                {/* ═══ HINT 2: "+N more" counter badge ═══ */}
                {scrollMeta.hiddenCount > 0 && (
                    <div
                        aria-hidden
                        className={cn(
                            'absolute right-2 top-2 z-10',
                            'flex items-center gap-0.5 rounded-full',
                            'bg-primary/90 px-2 py-0.5 shadow-sm',
                        )}
                    >
                        <span className="text-[9px] font-bold text-primary-foreground tabular-nums">
                            +{scrollMeta.hiddenCount}
                        </span>
                    </div>
                )}

            </div>

            {/* ═══ HINT 4: Scroll progress dots ═══ */}
            {scrollMeta.totalPages > 1 && (
                <div className="flex justify-center gap-1 pb-0.5">
                    {Array.from({ length: scrollMeta.totalPages }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1 rounded-full transition-all duration-200',
                                i === scrollMeta.currentPage
                                    ? 'w-4 bg-primary'
                                    : 'w-1 bg-border',
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export const StyleStrip = memo(StyleStripInner);
