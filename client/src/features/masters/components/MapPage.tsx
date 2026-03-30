'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ListBullets } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMastersCatalog } from '../hooks/useMastersCatalog';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useDistricts, useBrands, useStyleTags } from '../hooks/useCatalogLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { ROUTES } from '@/lib/constants/routes';
import { MapLeftPanel } from './map/MapLeftPanel';
import type { LocationType } from '../types/masters.types';
import type { BadgeFilters } from './map/MapLeftPanel';

const MasterMapView = dynamic(
  () => import('./map/MasterMapView').then((m) => m.MasterMapView),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-none bg-muted" /> },
);

export function MapPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { specialities } = useSpecialities();
  const { t } = useLanguage();

  // ─── Filter state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [selectedNiche, setSelectedNiche] = useState<string | undefined>(searchParams.get('niche') ?? undefined);
  const [cities, setCities] = useState<string[]>(() => {
    const param = searchParams.get('city');
    return param ? param.split(',').filter(Boolean) : [];
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(searchParams.get('language') ?? undefined);
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType | undefined>((searchParams.get('locationType') as LocationType) ?? undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(searchParams.get('district') ?? undefined);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(searchParams.get('brandSlug') ?? undefined);
  const [selectedStyleTag, setSelectedStyleTag] = useState<string | undefined>(searchParams.get('styleTagSlug') ?? undefined);
  const [selectedTier, setSelectedTier] = useState<string | undefined>(searchParams.get('masterTier') ?? undefined);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [badgeFilters, setBadgeFilters] = useState<BadgeFilters>({
    isVerified: searchParams.get('isVerified') === 'true',
    isCertified: searchParams.get('isCertified') === 'true',
    isHygieneVerified: searchParams.get('isHygieneVerified') === 'true',
    isQualityProducts: searchParams.get('isQualityProducts') === 'true',
    isTopRated: searchParams.get('isTopRated') === 'true',
  });
  const [highlightedUsername, setHighlightedUsername] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { districts } = useDistricts();
  const { brands } = useBrands();
  const { styleTags } = useStyleTags(selectedNiche);

  // ─── URL sync ─────────────────────────────────────────────────────────────
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
    if (selectedTier) params.set('masterTier', selectedTier);
    const qs = params.toString();
    router.replace(qs ? `${ROUTES.MAP}?${qs}` : ROUTES.MAP, { scroll: false });
  }, [debouncedSearch, selectedNiche, cities, page, badgeFilters, selectedLanguage, selectedLocationType, selectedDistrict, selectedBrand, selectedStyleTag, selectedTier, router]);

  // ─── Data ─────────────────────────────────────────────────────────────────
  const { masters, pagination, isLoading, isFetching } = useMastersCatalog({
    search: debouncedSearch || undefined,
    niche: selectedNiche,
    city: cities.length > 0 ? cities.join(',') : undefined,
    page,
    limit: 20,
    ...(badgeFilters.isVerified && { isVerified: true }),
    ...(badgeFilters.isCertified && { isCertified: true }),
    ...(badgeFilters.isHygieneVerified && { isHygieneVerified: true }),
    ...(badgeFilters.isQualityProducts && { isQualityProducts: true }),
    ...(badgeFilters.isTopRated && { isTopRated: true }),
    masterTier: selectedTier,
    language: selectedLanguage,
    locationType: selectedLocationType,
    district: selectedDistrict,
    brandSlug: selectedBrand,
    styleTagSlug: selectedStyleTag,
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((v: string): void => { setSearchInput(v); setPage(1); }, []);
  const handleNicheChange = useCallback((v: string | undefined): void => { setSelectedNiche(v); setPage(1); }, []);
  const handleToggleCity = useCallback((slug: string): void => { setCities((prev) => prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]); setPage(1); }, []);
  const handleRemoveCity = useCallback((slug: string): void => { setCities((prev) => prev.filter((c) => c !== slug)); setPage(1); }, []);
  const handleBadgeToggle = useCallback((key: keyof BadgeFilters): void => { setBadgeFilters((prev) => ({ ...prev, [key]: !prev[key] })); setPage(1); }, []);
  const handleClearFilters = useCallback((): void => {
    setSearchInput(''); setSelectedNiche(undefined); setCities([]);
    setBadgeFilters({ isVerified: false, isCertified: false, isHygieneVerified: false, isQualityProducts: false, isTopRated: false });
    setSelectedLanguage(undefined); setSelectedLocationType(undefined);
    setSelectedDistrict(undefined); setSelectedBrand(undefined);
    setSelectedStyleTag(undefined); setSelectedTier(undefined);
    setPage(1);
  }, []);

  const handleTierChange = useCallback((v: string | undefined): void => { setSelectedTier(v); setPage(1); }, []);
  const handleLanguageChange = useCallback((v: string | undefined): void => { setSelectedLanguage(v); setPage(1); }, []);
  const handleLocationTypeChange = useCallback((v: LocationType | undefined): void => { setSelectedLocationType(v); setPage(1); }, []);
  const handleDistrictChange = useCallback((v: string | undefined): void => { setSelectedDistrict(v); setPage(1); }, []);
  const handleBrandChange = useCallback((v: string | undefined): void => { setSelectedBrand(v); setPage(1); }, []);
  const handleStyleTagChange = useCallback((v: string | undefined): void => { setSelectedStyleTag(v); setPage(1); }, []);

  const activeBadgeCount = Object.values(badgeFilters).filter(Boolean).length;
  const extraFilterCount = [selectedLanguage, selectedLocationType, selectedDistrict, selectedBrand, selectedStyleTag, selectedTier].filter(Boolean).length;
  const hasActiveFilters = !!debouncedSearch || !!selectedNiche || cities.length > 0 || activeBadgeCount > 0 || extraFilterCount > 0;
  const activeFilterCount = [debouncedSearch, selectedNiche].filter(Boolean).length + (cities.length > 0 ? 1 : 0) + activeBadgeCount + extraFilterCount;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100dvh-9.5rem)] md:h-[calc(100dvh-3.5rem)] flex-col-reverse lg:flex-row overflow-hidden">
      {/* Left panel — bottom on mobile (flex-col-reverse), left on desktop */}
      <div className="h-[50%] flex flex-col min-h-0 lg:h-full lg:w-[420px] shrink-0">
        <MapLeftPanel
          searchInput={searchInput}
          onSearchChange={handleSearchChange}
          selectedNiche={selectedNiche}
          onNicheChange={handleNicheChange}
          cities={cities}
          onToggleCity={handleToggleCity}
          onRemoveCity={handleRemoveCity}
          badgeFilters={badgeFilters}
          onBadgeToggle={handleBadgeToggle}
          selectedTier={selectedTier}
          onTierChange={handleTierChange}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          selectedLocationType={selectedLocationType}
          onLocationTypeChange={handleLocationTypeChange}
          selectedDistrict={selectedDistrict}
          onDistrictChange={handleDistrictChange}
          selectedBrand={selectedBrand}
          onBrandChange={handleBrandChange}
          selectedStyleTag={selectedStyleTag}
          onStyleTagChange={handleStyleTagChange}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={handleClearFilters}
          masters={masters}
          totalItems={pagination?.totalItems ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          onPageChange={setPage}
          highlightedUsername={highlightedUsername}
          onMasterHover={setHighlightedUsername}
          specialities={specialities}
          districts={districts}
          brands={brands}
          styleTags={styleTags}
        />
      </div>

      {/* Right panel — map (top on mobile due to flex-col-reverse, right on desktop) */}
      <div className="relative flex-1 min-h-0 lg:h-full">
        <MasterMapView
          masters={masters}
          highlightedUsername={highlightedUsername}
          onMasterHover={setHighlightedUsername}
        />

        {/* "List view" button */}
        <Link
          href={ROUTES.MASTERS}
          className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-xl border border-border/60 bg-background/90 px-3 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:shadow-md"
        >
          <ListBullets size={14} weight="bold" />
          {t('catalog.btn_list')}
        </Link>
      </div>
    </div>
  );
}
