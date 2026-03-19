'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    MapPin, ArrowRight, MagnifyingGlass, X, CaretLeft, CaretRight, CaretDown, Check,
    Eye, HandPalm, PaintBrush, Scissors, Drop, Sparkle, SquaresFour,
    SlidersHorizontal, UsersFour, MapTrifold, ListBullets,
    SealCheck, Certificate, FirstAid, Diamond, Star,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMastersCatalog } from '../hooks/useMastersCatalog';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { useDistricts, useBrands, useStyleTags } from '../hooks/useCatalogLookups';
import { getCityOptions, getCityLabel } from '@/lib/constants/cities';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { getThumbUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { MasterBadgesRow } from './MasterBadges';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { useFavoriteStatus } from '@/features/favorites/hooks/useFavorites';
import { useAppSelector } from '@/store/hooks';
import type { LocationType } from '../types/masters.types';

const MasterMapView = dynamic(
  () => import('./map/MasterMapView').then((m) => m.MasterMapView),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" /> },
);

const NICHE_META: Record<string, { icon: Icon }> = {
    lashes:   { icon: Eye },
    nails:    { icon: HandPalm },
    brows:    { icon: Eye },
    makeup:   { icon: PaintBrush },
    hair:     { icon: Scissors },
    skincare: { icon: Drop },
};

export function MastersCatalog(): React.ReactElement {
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { specialities } = useSpecialities();
    const cityOptions = getCityOptions(language);

    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
    const [selectedNiche, setSelectedNiche] = useState<string | undefined>(searchParams.get('niche') ?? undefined);
    const [cities, setCities] = useState<string[]>(() => {
        const param = searchParams.get('city');
        return param ? param.split(',').filter(Boolean) : [];
    });
    const [cityOpen, setCityOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(searchParams.get('language') ?? undefined);
    const [selectedLocationType, setSelectedLocationType] = useState<LocationType | undefined>((searchParams.get('locationType') as LocationType) ?? undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(searchParams.get('district') ?? undefined);
    const [selectedBrand, setSelectedBrand] = useState<string | undefined>(searchParams.get('brandSlug') ?? undefined);
    const [selectedStyleTag, setSelectedStyleTag] = useState<string | undefined>(searchParams.get('styleTagSlug') ?? undefined);
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [badgeFilters, setBadgeFilters] = useState({
        isVerified: searchParams.get('isVerified') === 'true',
        isCertified: searchParams.get('isCertified') === 'true',
        isHygieneVerified: searchParams.get('isHygieneVerified') === 'true',
        isQualityProducts: searchParams.get('isQualityProducts') === 'true',
        isTopRated: searchParams.get('isTopRated') === 'true',
    });

    const debouncedSearch = useDebounce(searchInput, 400);

    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [highlightedUsername, setHighlightedUsername] = useState<string | null>(null);

    const { districts } = useDistricts();
    const { brands } = useBrands();
    const { styleTags } = useStyleTags(selectedNiche);

    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedNiche) params.set('niche', selectedNiche);
        if (cities.length > 0) params.set('city', cities.join(','));
        if (page > 1) params.set('page', String(page));
        if (badgeFilters.isVerified) params.set('isVerified', 'true');
        if (badgeFilters.isCertified) params.set('isCertified', 'true');
        if (badgeFilters.isHygieneVerified) params.set('isHygieneVerified', 'true');
        if (badgeFilters.isQualityProducts) params.set('isQualityProducts', 'true');
        if (badgeFilters.isTopRated) params.set('isTopRated', 'true');
        if (selectedLanguage) params.set('language', selectedLanguage);
        if (selectedLocationType) params.set('locationType', selectedLocationType);
        if (selectedDistrict) params.set('district', selectedDistrict);
        if (selectedBrand) params.set('brandSlug', selectedBrand);
        if (selectedStyleTag) params.set('styleTagSlug', selectedStyleTag);
        const qs = params.toString();
        router.replace(qs ? `${ROUTES.MASTERS}?${qs}` : ROUTES.MASTERS, { scroll: false });
    }, [debouncedSearch, selectedNiche, cities, page, badgeFilters, selectedLanguage, selectedLocationType, selectedDistrict, selectedBrand, selectedStyleTag, router]);

    const { masters, pagination, isLoading, isFetching } = useMastersCatalog({
        search: debouncedSearch || undefined,
        niche: selectedNiche,
        city: cities.length > 0 ? cities.join(',') : undefined,
        page,
        limit: 12,
        ...(badgeFilters.isVerified && { isVerified: true }),
        ...(badgeFilters.isCertified && { isCertified: true }),
        ...(badgeFilters.isHygieneVerified && { isHygieneVerified: true }),
        ...(badgeFilters.isQualityProducts && { isQualityProducts: true }),
        ...(badgeFilters.isTopRated && { isTopRated: true }),
        language: selectedLanguage,
        locationType: selectedLocationType,
        district: selectedDistrict,
        brandSlug: selectedBrand,
        styleTagSlug: selectedStyleTag,
    });

    const handleNicheChange = useCallback((niche: string | undefined): void => {
        setSelectedNiche(niche);
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((value: string): void => {
        setSearchInput(value);
        setPage(1);
    }, []);

    const toggleCity = useCallback((slug: string): void => {
        setCities((prev) =>
            prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
        );
        setPage(1);
    }, []);

    const removeCity = useCallback((slug: string): void => {
        setCities((prev) => prev.filter((c) => c !== slug));
        setPage(1);
    }, []);

    const handleBadgeToggle = useCallback((key: keyof typeof badgeFilters): void => {
        setBadgeFilters((prev) => ({ ...prev, [key]: !prev[key] }));
        setPage(1);
    }, []);

    const clearFilters = useCallback((): void => {
        setSearchInput('');
        setSelectedNiche(undefined);
        setCities([]);
        setBadgeFilters({ isVerified: false, isCertified: false, isHygieneVerified: false, isQualityProducts: false, isTopRated: false });
        setSelectedLanguage(undefined);
        setSelectedLocationType(undefined);
        setSelectedDistrict(undefined);
        setSelectedBrand(undefined);
        setSelectedStyleTag(undefined);
        setPage(1);
    }, []);

    const activeBadgeCount = Object.values(badgeFilters).filter(Boolean).length;
    const extraFilterCount = [selectedLanguage, selectedLocationType, selectedDistrict, selectedBrand, selectedStyleTag].filter(Boolean).length;
    const hasActiveFilters = !!debouncedSearch || !!selectedNiche || cities.length > 0 || activeBadgeCount > 0 || extraFilterCount > 0;
    const activeFilterCount = [debouncedSearch, selectedNiche].filter(Boolean).length + (cities.length > 0 ? 1 : 0) + activeBadgeCount + extraFilterCount;

    return (
        <div className="mx-auto w-full max-w-6xl lg:max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
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

            {/* Filter bar */}
            <motion.div
                className="rounded-2xl border border-border/60 bg-card p-4 mb-8 shadow-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                {/* Search + City row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <MagnifyingGlass
                            size={18}
                            weight="regular"
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={t('catalog.search_placeholder')}
                            className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                            >
                                <X size={12} weight="bold" />
                            </button>
                        )}
                    </div>

                    {/* City multi-select */}
                    <div className="sm:w-60">
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="relative flex h-11 w-full items-center gap-1.5 rounded-xl border border-border/50 bg-background pl-10 pr-9 text-sm font-medium text-left outline-none transition-all duration-200 hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                    <MapPin size={16} weight="fill" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                                    {cities.length === 0 ? (
                                        <span className="text-muted-foreground/50 truncate">
                                            {t('catalog.city_placeholder')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 truncate">
                                            {cities.slice(0, 2).map((c) => (
                                                <span
                                                    key={c}
                                                    className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
                                                >
                                                    {cityOptions.find((o) => o.value === c)?.label ?? c}
                                                    <X
                                                        size={10}
                                                        weight="bold"
                                                        className="cursor-pointer hover:text-destructive"
                                                        onClick={(e) => { e.stopPropagation(); removeCity(c); }}
                                                    />
                                                </span>
                                            ))}
                                            {cities.length > 2 && (
                                                <span className="text-xs text-muted-foreground">+{cities.length - 2}</span>
                                            )}
                                        </span>
                                    )}
                                    <CaretDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-55 p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={t('catalog.city_placeholder')} />
                                    <CommandList>
                                        <CommandEmpty>—</CommandEmpty>
                                        <CommandGroup>
                                            {cityOptions.map((c) => {
                                                const selected = cities.includes(c.value);
                                                return (
                                                    <CommandItem
                                                        key={c.value}
                                                        value={c.label}
                                                        onSelect={() => toggleCity(c.value)}
                                                    >
                                                        <div className={cn(
                                                            'mr-1 flex h-4 w-4 items-center justify-center rounded border border-primary/40',
                                                            selected ? 'bg-primary border-primary' : 'bg-transparent'
                                                        )}>
                                                            {selected && <Check size={10} weight="bold" className="text-primary-foreground" />}
                                                        </div>
                                                        {c.label}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Clear all */}
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button
                                type="button"
                                onClick={clearFilters}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 cursor-pointer shrink-0"
                            >
                                <SlidersHorizontal size={15} weight="regular" />
                                {t('catalog.clear_filters')}
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-destructive/15 px-1 text-[11px] font-semibold tabular-nums">
                                    {activeFilterCount}
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Category chips */}
                <div
                    className="flex gap-2 mt-4 pt-4 border-t border-border/40 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <NicheChip
                        isActive={!selectedNiche}
                        onClick={() => handleNicheChange(undefined)}
                        icon={SquaresFour}
                        label={t('masters.all_categories')}
                    />
                    {specialities.map((spec) => {
                        const meta = NICHE_META[spec.slug];
                        return (
                            <NicheChip
                                key={spec.slug}
                                isActive={selectedNiche === spec.slug}
                                onClick={() => handleNicheChange(spec.slug)}
                                icon={meta?.icon ?? Sparkle}
                                label={spec.label}
                            />
                        );
                    })}
                </div>

                {/* Badge filters */}
                <div
                    className="flex gap-2 mt-3 pt-3 border-t border-border/40 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <BadgeFilterChip
                        checked={badgeFilters.isVerified}
                        onToggle={() => handleBadgeToggle('isVerified')}
                        icon={SealCheck}
                        label={t('catalog.filter_verified')}
                        colorClass="text-primary"
                    />
                    <BadgeFilterChip
                        checked={badgeFilters.isCertified}
                        onToggle={() => handleBadgeToggle('isCertified')}
                        icon={Certificate}
                        label={t('catalog.filter_certified')}
                        colorClass="text-primary"
                    />
                    <BadgeFilterChip
                        checked={badgeFilters.isHygieneVerified}
                        onToggle={() => handleBadgeToggle('isHygieneVerified')}
                        icon={FirstAid}
                        label={t('catalog.filter_hygiene')}
                        colorClass="text-success"
                    />
                    <BadgeFilterChip
                        checked={badgeFilters.isQualityProducts}
                        onToggle={() => handleBadgeToggle('isQualityProducts')}
                        icon={Diamond}
                        label={t('catalog.filter_quality')}
                        colorClass="text-info"
                    />
                    <BadgeFilterChip
                        checked={badgeFilters.isTopRated}
                        onToggle={() => handleBadgeToggle('isTopRated')}
                        icon={Star}
                        label={t('catalog.filter_top_rated')}
                        colorClass="text-warning"
                    />
                </div>

                {/* Extra filters row */}
                <div
                    className="flex gap-2 mt-3 pt-3 border-t border-border/40 overflow-x-auto scrollbar-hide flex-wrap"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* Language */}
                    <SelectFilterChip
                        value={selectedLanguage}
                        onChange={(v) => { setSelectedLanguage(v); setPage(1); }}
                        label={t('catalog.filter_language')}
                        options={LANGUAGE_OPTIONS}
                    />
                    {/* Location type */}
                    <SelectFilterChip
                        value={selectedLocationType}
                        onChange={(v) => { setSelectedLocationType(v as LocationType | undefined); setPage(1); }}
                        label={t('catalog.filter_location_type')}
                        options={LOCATION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(`catalog.location_${o.value}`) }))}
                    />
                    {/* District */}
                    {districts.length > 0 && (
                        <SelectFilterChip
                            value={selectedDistrict}
                            onChange={(v) => { setSelectedDistrict(v); setPage(1); }}
                            label={t('catalog.filter_district')}
                            options={districts.map((d) => ({ value: d.slug, label: d.name }))}
                        />
                    )}
                    {/* Brand */}
                    {brands.length > 0 && (
                        <SelectFilterChip
                            value={selectedBrand}
                            onChange={(v) => { setSelectedBrand(v); setPage(1); }}
                            label={t('catalog.filter_brand')}
                            options={brands.map((b) => ({ value: b.slug, label: b.name }))}
                        />
                    )}
                    {/* Style tag */}
                    {styleTags.length > 0 && (
                        <SelectFilterChip
                            value={selectedStyleTag}
                            onChange={(v) => { setSelectedStyleTag(v); setPage(1); }}
                            label={t('catalog.filter_style_tag')}
                            options={styleTags.map((s) => ({ value: s.slug, label: s.name }))}
                        />
                    )}
                </div>
            </motion.div>

            {/* Results bar */}
            {pagination && !isLoading && (
                <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex items-center gap-2">
                        <UsersFour size={16} weight="regular" className="text-muted-foreground" />
                        <p className="text-sm text-muted-foreground tabular-nums">
                            {t('catalog.results_count').replace('{{count}}', String(pagination.totalItems))}
                        </p>
                    </div>
                    {isFetching && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                </motion.div>
            )}

            {/* Split layout wrapper */}
            <div className="flex gap-6">
                {/* Left: List */}
                <div className={cn(
                    'w-full lg:w-[45%] lg:block',
                    viewMode === 'map' && 'hidden lg:block',
                )}>
                    {/* Masters grid */}
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <CatalogCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : masters.length === 0 ? (
                        <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {masters.map((master, index) => (
                                <CatalogMasterCard
                                    key={master.username}
                                    master={master}
                                    index={index}
                                    isHighlighted={highlightedUsername === master.username}
                                    onMouseEnter={() => setHighlightedUsername(master.username)}
                                    onMouseLeave={() => setHighlightedUsername(null)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <PaginationBar
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={setPage}
                        />
                    )}
                </div>

                {/* Right: Map */}
                <div className={cn(
                    'lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-6rem)] lg:w-[55%]',
                    viewMode === 'list' ? 'hidden lg:block' : 'fixed inset-0 z-40 h-dvh lg:relative lg:inset-auto lg:h-auto',
                )}>
                    <MasterMapView
                        key={viewMode}
                        masters={masters}
                        highlightedUsername={highlightedUsername}
                        onMasterHover={setHighlightedUsername}
                    />
                </div>
            </div>

            {/* Mobile toggle button */}
            <button
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                className="fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] lg:hidden motion-safe:animate-bounce"
                style={{ animationIterationCount: 5 }}
            >
                {viewMode === 'list' ? (
                    <><MapTrifold size={18} weight="fill" /> {t('catalog.btn_map')}</>
                ) : (
                    <><ListBullets size={18} weight="bold" /> {t('catalog.btn_list')}</>
                )}
            </button>
        </div>
    );
}

// ─── Niche Chip ──────────────────────────────────────────────────────────────

interface NicheChipProps {
    isActive: boolean;
    onClick: () => void;
    icon: Icon;
    label: string;
}

function NicheChip({ isActive, onClick, icon: IconComponent, label }: NicheChipProps): React.ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200 cursor-pointer border',
                isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                    : 'bg-background text-muted-foreground border-border/50 hover:border-border hover:text-foreground hover:shadow-sm',
            )}
        >
            <IconComponent size={15} weight={isActive ? 'fill' : 'regular'} />
            {label}
        </button>
    );
}

// ─── Badge Filter Chip ──────────────────────────────────────────────────────

interface BadgeFilterChipProps {
    checked: boolean;
    onToggle: () => void;
    icon: Icon;
    label: string;
    colorClass: string;
}

function BadgeFilterChip({ checked, onToggle, icon: IconComponent, label, colorClass }: BadgeFilterChipProps): React.ReactElement {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer border',
                checked
                    ? 'bg-primary/8 text-foreground border-primary/40 shadow-sm'
                    : 'bg-background text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
            )}
        >
            <Checkbox
                checked={checked}
                className="pointer-events-none h-3.5 w-3.5 rounded-[4px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                tabIndex={-1}
            />
            <IconComponent size={14} weight={checked ? 'fill' : 'regular'} className={checked ? colorClass : ''} />
            {label}
        </button>
    );
}

// ─── Catalog Master Card ─────────────────────────────────────────────────────

interface CatalogMasterCardProps {
    master: {
        masterProfileId: string | null;
        username: string;
        displayName: string;
        avatar: string | null;
        city: string | null;
        niche: string | null;
        portfolioImages: { id: string; imageUrl: string; title: string | null }[];
        totalItems: number;
        isVerified?: boolean;
        badges?: {
            isCertified: boolean;
            isHygieneVerified: boolean;
            isQualityProducts: boolean;
            isTopRated: boolean;
        };
        experienceYears?: number | null;
    };
    index: number;
    isHighlighted?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function CatalogMasterCard({ master, index, isHighlighted, onMouseEnter, onMouseLeave }: CatalogMasterCardProps): React.ReactElement {
    const { language } = useLanguage();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const masterIds = master.masterProfileId ? [master.masterProfileId] : [];
    const { status } = useFavoriteStatus(masterIds, []);
    const isFavorited = master.masterProfileId ? status?.masters[master.masterProfileId] ?? false : false;
    const images = master.portfolioImages;
    const cityDisplay = master.city ? getCityLabel(master.city, language) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Link
                href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
                className={cn(
                    'group flex flex-col sm:flex-row rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-border/80 overflow-hidden',
                    isHighlighted && 'ring-2 ring-primary/50',
                )}
            >
                {/* Portfolio images */}
                <div className="relative w-full sm:w-72 md:w-80 shrink-0 aspect-4/3 sm:aspect-auto sm:h-48 bg-muted/30">
                    {images.length >= 4 ? (
                        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-px">
                            {images.slice(0, 4).map((img) => (
                                <div key={img.id} className="relative overflow-hidden">
                                    <Image
                                        src={getThumbUrl(img.imageUrl, 256)}
                                        alt={img.title ?? ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, 320px"
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
                                        sizes="(max-width: 640px) 100vw, 320px"
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

                    {master.totalItems > 4 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            +{master.totalItems - 4}
                        </div>
                    )}

                    {isAuthenticated && master.masterProfileId && (
                        <div className="absolute right-2 top-2 z-10">
                            <FavoriteButton
                                entityType="master"
                                entityId={master.masterProfileId}
                                isFavorited={isFavorited}
                            />
                        </div>
                    )}
                </div>

                {/* Master info */}
                <div className="flex flex-1 items-center gap-4 p-4 sm:p-5">
                    {master.avatar ? (
                        <Image
                            src={getThumbUrl(master.avatar, 96)}
                            alt={master.displayName}
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-background"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary ring-2 ring-background">
                            {master.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                            {master.displayName}
                        </p>
                        <MasterBadgesRow isVerified={master.isVerified} badges={master.badges} />
                        <div className="flex items-center gap-2 mt-1">
                            {cityDisplay && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin size={12} weight="fill" className="shrink-0" />
                                    {cityDisplay}
                                </span>
                            )}
                            {cityDisplay && master.niche && (
                                <span className="text-border">·</span>
                            )}
                            {master.niche && (
                                <span className="text-xs text-muted-foreground">
                                    {master.niche}
                                </span>
                            )}
                        </div>
                        {master.experienceYears != null && master.experienceYears > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground/70">
                                {master.experienceYears} {master.experienceYears === 1 ? 'year' : 'years'} experience
                            </p>
                        )}
                    </div>

                    <ArrowRight
                        size={16}
                        weight="bold"
                        className="shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5"
                    />
                </div>
            </Link>
        </motion.div>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
    { value: 'ka', label: 'ქართული' },
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
    { value: 'tr', label: 'Türkçe' },
];

const LOCATION_TYPE_OPTIONS = [
    { value: 'salon', label: 'Salon' },
    { value: 'home_studio', label: 'Home studio' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'client_visit', label: 'Client visit' },
];

// ─── Select Filter Chip ──────────────────────────────────────────────────────

interface SelectFilterChipProps {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    label: string;
    options: { value: string; label: string }[];
}

function SelectFilterChip({ value, onChange, label, options }: SelectFilterChipProps): React.ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer border',
                        value
                            ? 'bg-primary/8 text-foreground border-primary/40 shadow-sm'
                            : 'bg-background text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
                    )}
                >
                    {value ? options.find((o) => o.value === value)?.label ?? label : label}
                    <CaretDown size={12} className="text-muted-foreground" />
                    {value && (
                        <X
                            size={10}
                            weight="bold"
                            className="ml-0.5 cursor-pointer hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
                        />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start">
                <Command>
                    <CommandInput placeholder={label} />
                    <CommandList>
                        <CommandEmpty>—</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.value}
                                    value={opt.label}
                                    onSelect={() => {
                                        onChange(value === opt.value ? undefined : opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <div className={cn(
                                        'mr-1 flex h-4 w-4 items-center justify-center rounded border border-primary/40',
                                        value === opt.value ? 'bg-primary border-primary' : 'bg-transparent'
                                    )}>
                                        {value === opt.value && <Check size={10} weight="bold" className="text-primary-foreground" />}
                                    </div>
                                    {opt.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

interface PaginationBarProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function PaginationBar({ page, totalPages, onPageChange }: PaginationBarProps): React.ReactElement {
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
        <div className="flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Skeleton className="w-full sm:w-72 md:w-80 shrink-0 aspect-4/3 sm:aspect-auto sm:h-48 rounded-none" />
            <div className="flex flex-1 items-center gap-4 p-4 sm:p-5">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        </div>
    );
}
