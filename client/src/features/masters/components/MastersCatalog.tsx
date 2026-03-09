'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, ArrowRight, MagnifyingGlass, FunnelSimple, X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMastersCatalog } from '../hooks/useMastersCatalog';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { getServerImageUrl, getThumbUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

const NICHE_ICONS: Record<string, string> = {
    lashes: '✦',
    nails: '💅',
    brows: '✧',
    makeup: '💄',
    hair: '✂',
    skincare: '✿',
};

export function MastersCatalog(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { specialities } = useSpecialities();

    // Read initial state from URL
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
    const [selectedNiche, setSelectedNiche] = useState<string | undefined>(searchParams.get('niche') ?? undefined);
    const [city, setCity] = useState(searchParams.get('city') ?? '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const debouncedSearch = useDebounce(searchInput, 400);
    const debouncedCity = useDebounce(city, 400);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedNiche) params.set('niche', selectedNiche);
        if (debouncedCity) params.set('city', debouncedCity);
        if (page > 1) params.set('page', String(page));
        const qs = params.toString();
        router.replace(qs ? `${ROUTES.MASTERS}?${qs}` : ROUTES.MASTERS, { scroll: false });
    }, [debouncedSearch, selectedNiche, debouncedCity, page, router]);

    const { masters, pagination, isLoading, isFetching } = useMastersCatalog({
        search: debouncedSearch || undefined,
        niche: selectedNiche,
        city: debouncedCity || undefined,
        page,
        limit: 12,
    });

    const handleNicheChange = useCallback((niche: string | undefined): void => {
        setSelectedNiche(niche);
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((value: string): void => {
        setSearchInput(value);
        setPage(1);
    }, []);

    const handleCityChange = useCallback((value: string): void => {
        setCity(value);
        setPage(1);
    }, []);

    const clearFilters = useCallback((): void => {
        setSearchInput('');
        setSelectedNiche(undefined);
        setCity('');
        setPage(1);
    }, []);

    const hasActiveFilters = !!debouncedSearch || !!selectedNiche || !!debouncedCity;

    return (
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Page header */}
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t('catalog.title')}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                    {t('catalog.subtitle')}
                </p>
            </motion.div>

            {/* Search & City filters */}
            <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                {/* Search input */}
                <div className="relative flex-1">
                    <MagnifyingGlass
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={t('catalog.search_placeholder')}
                        className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => handleSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* City input */}
                <div className="relative sm:w-56">
                    <MapPin
                        size={18}
                        weight="fill"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        placeholder={t('catalog.city_placeholder')}
                        className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
                    />
                    {city && (
                        <button
                            type="button"
                            onClick={() => handleCityChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200 cursor-pointer shrink-0"
                    >
                        <FunnelSimple size={16} />
                        {t('catalog.clear_filters')}
                    </button>
                )}
            </motion.div>

            {/* Category tabs */}
            <motion.div
                className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
            >
                <button
                    type="button"
                    onClick={() => handleNicheChange(undefined)}
                    className={cn(
                        'shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
                        !selectedNiche
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                >
                    {t('masters.all_categories')}
                </button>
                {specialities.map((spec) => (
                    <button
                        key={spec.slug}
                        type="button"
                        onClick={() => handleNicheChange(spec.slug)}
                        className={cn(
                            'shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
                            selectedNiche === spec.slug
                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <span className="text-xs">{NICHE_ICONS[spec.slug] ?? '✦'}</span>
                        {spec.label}
                    </button>
                ))}
            </motion.div>

            {/* Results count */}
            {pagination && !isLoading && (
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-muted-foreground">
                        {t('catalog.results_count').replace('{{count}}', String(pagination.totalItems))}
                    </p>
                    {isFetching && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                </div>
            )}

            {/* Masters grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <CatalogCardSkeleton key={i} />
                    ))}
                </div>
            ) : masters.length === 0 ? (
                <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {masters.map((master, index) => (
                        <CatalogMasterCard key={master.username} master={master} index={index} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}

// ─── Catalog Master Card ─────────────────────────────────────────────────────

interface CatalogMasterCardProps {
    master: {
        username: string;
        displayName: string;
        avatar: string | null;
        city: string | null;
        niche: string | null;
        portfolioImages: { id: string; imageUrl: string; title: string | null }[];
        totalItems: number;
    };
    index: number;
}

function CatalogMasterCard({ master, index }: CatalogMasterCardProps): React.ReactElement {
    const images = master.portfolioImages;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
        >
            <Link
                href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-border/80"
            >
                {/* Image grid — 2x2 mosaic */}
                <div className="relative aspect-4/3 overflow-hidden bg-muted/30">
                    {images.length >= 4 ? (
                        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-px">
                            {images.slice(0, 4).map((img) => (
                                <div key={img.id} className="relative overflow-hidden">
                                    <Image
                                        src={getThumbUrl(img.imageUrl, 256)}
                                        alt={img.title ?? ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    ) : images.length > 0 ? (
                        <div className={cn(
                            'grid h-full w-full gap-px',
                            images.length === 1 && 'grid-cols-1',
                            images.length === 2 && 'grid-cols-2',
                            images.length === 3 && 'grid-cols-2 grid-rows-2',
                        )}>
                            {images.map((img, i) => (
                                <div
                                    key={img.id}
                                    className={cn(
                                        'relative overflow-hidden',
                                        images.length === 3 && i === 0 && 'row-span-2',
                                    )}
                                >
                                    <Image
                                        src={getThumbUrl(img.imageUrl, 256)}
                                        alt={img.title ?? ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-3xl font-bold text-muted-foreground/20">
                                {master.displayName.charAt(0)}
                            </span>
                        </div>
                    )}

                    {/* Total items badge */}
                    {master.totalItems > 4 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            +{master.totalItems - 4}
                        </div>
                    )}
                </div>

                {/* Master info */}
                <div className="flex items-center gap-3 p-3.5">
                    {master.avatar ? (
                        <Image
                            src={getServerImageUrl(master.avatar)}
                            alt={master.displayName}
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-background"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-background">
                            {master.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                            {master.displayName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {master.city && (
                                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground truncate">
                                    <MapPin size={10} weight="fill" className="shrink-0" />
                                    {master.city}
                                </span>
                            )}
                            {master.city && master.niche && (
                                <span className="text-border">·</span>
                            )}
                            {master.niche && (
                                <span className="text-[11px] text-muted-foreground truncate">
                                    {master.niche}
                                </span>
                            )}
                        </div>
                    </div>

                    <ArrowRight
                        size={14}
                        weight="bold"
                        className="shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5"
                    />
                </div>
            </Link>
        </motion.div>
    );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="flex items-center justify-center gap-2 mt-10">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-all duration-200 cursor-pointer',
                    page <= 1
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:border-border hover:text-foreground hover:shadow-sm active:scale-95',
                )}
                aria-label={t('catalog.prev_page')}
            >
                <CaretLeft size={16} weight="bold" />
            </button>

            <div className="flex items-center gap-1">
                {generatePageNumbers(page, totalPages).map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-muted-foreground/50">...</span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p as number)}
                            className={cn(
                                'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition-all duration-200 cursor-pointer',
                                page === p
                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            {p}
                        </button>
                    ),
                )}
            </div>

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-all duration-200 cursor-pointer',
                    page >= totalPages
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:border-border hover:text-foreground hover:shadow-sm active:scale-95',
                )}
                aria-label={t('catalog.next_page')}
            >
                <CaretRight size={16} weight="bold" />
            </button>
        </div>
    );
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('...');
    pages.push(total);

    return pages;
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
    hasFilters: boolean;
    onClear: () => void;
}

function EmptyState({ hasFilters, onClear }: EmptyStateProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <MagnifyingGlass size={28} className="text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
                {t('catalog.empty_title')}
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                {t('catalog.empty_description')}
            </p>
            {hasFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
                >
                    {t('catalog.clear_filters')}
                </button>
            )}
        </motion.div>
    );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CatalogCardSkeleton(): React.ReactElement {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <div className="flex items-center gap-3 p-3.5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                </div>
            </div>
        </div>
    );
}
