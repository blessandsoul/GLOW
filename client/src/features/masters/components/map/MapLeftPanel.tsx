'use client';

import { useState } from 'react';
import {
  MagnifyingGlass, X, MapPin, CaretDown, Check, CaretLeft, CaretRight,
  SquaresFour, Eye, HandPalm, PaintBrush, Scissors, Drop, Sparkle,
  SlidersHorizontal, UsersFour,
  SealCheck, Certificate, FirstAid, Diamond, Star,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getCityOptions } from '@/lib/constants/cities';
import { cn } from '@/lib/utils';
import { CompactMasterCard } from './CompactMasterCard';
import type { FeaturedMaster, LocationType, CatalogDistrict, CatalogBrand, CatalogStyleTag } from '../../types/masters.types';

interface BadgeFilters {
  isVerified: boolean;
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
  isTopRated: boolean;
}

export interface MapLeftPanelProps {
  // Filter state (controlled from MapPage)
  searchInput: string;
  onSearchChange: (v: string) => void;
  selectedNiche: string | undefined;
  onNicheChange: (v: string | undefined) => void;
  cities: string[];
  onToggleCity: (slug: string) => void;
  onRemoveCity: (slug: string) => void;
  badgeFilters: BadgeFilters;
  onBadgeToggle: (key: keyof BadgeFilters) => void;
  selectedTier: string | undefined;
  onTierChange: (v: string | undefined) => void;
  selectedLanguage: string | undefined;
  onLanguageChange: (v: string | undefined) => void;
  selectedLocationType: LocationType | undefined;
  onLocationTypeChange: (v: string | undefined) => void;
  selectedDistrict: string | undefined;
  onDistrictChange: (v: string | undefined) => void;
  selectedBrand: string | undefined;
  onBrandChange: (v: string | undefined) => void;
  selectedStyleTag: string | undefined;
  onStyleTagChange: (v: string | undefined) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  // Data
  masters: FeaturedMaster[];
  totalItems: number;
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  highlightedUsername: string | null;
  onMasterHover: (username: string | null) => void;
  // Lookup data
  specialities: { slug: string; label: string }[];
  districts: CatalogDistrict[];
  brands: CatalogBrand[];
  styleTags: CatalogStyleTag[];
}

const NICHE_META: Record<string, { icon: Icon }> = {
  'lashes-brows': { icon: Eye },
  nails: { icon: HandPalm },
  makeup: { icon: PaintBrush },
  hair: { icon: Scissors },
  skincare: { icon: Drop },
};

const LANGUAGE_OPTIONS = [
  { value: 'ka', label: 'ქართული' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
];

const LOCATION_TYPE_OPTIONS = [
  { value: 'salon' },
  { value: 'home_studio' },
  { value: 'mobile' },
  { value: 'client_visit' },
];

export function MapLeftPanel({
  searchInput, onSearchChange,
  selectedNiche, onNicheChange,
  cities, onToggleCity, onRemoveCity,
  badgeFilters, onBadgeToggle,
  selectedTier, onTierChange,
  selectedLanguage, onLanguageChange,
  selectedLocationType, onLocationTypeChange,
  selectedDistrict, onDistrictChange,
  selectedBrand, onBrandChange,
  selectedStyleTag, onStyleTagChange,
  hasActiveFilters, activeFilterCount, onClearFilters,
  masters, totalItems, isLoading, isFetching,
  page, totalPages, onPageChange,
  highlightedUsername, onMasterHover,
  specialities, districts, brands, styleTags,
}: MapLeftPanelProps): React.ReactElement {
  const { t, language } = useLanguage();
  const [cityOpen, setCityOpen] = useState(false);
  const cityOptions = getCityOptions(language);

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-border/60">
      {/* Filter section — compact, non-scrolling */}
      <div className="shrink-0 border-b border-border/40 p-3 space-y-2.5">
        {/* Search + City row */}
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('catalog.search_placeholder')}
              className="h-9 w-full rounded-xl border border-border/50 bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-all"
              >
                <X size={11} weight="bold" />
              </button>
            )}
          </div>

          {/* City multi-select */}
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex h-9 w-36 shrink-0 items-center gap-1 rounded-xl border border-border/50 bg-background pl-8 pr-7 text-xs font-medium outline-none transition-all hover:border-border focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MapPin size={14} weight="fill" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                {cities.length === 0 ? (
                  <span className="text-muted-foreground/50 truncate">{t('catalog.city_placeholder')}</span>
                ) : (
                  <span className="flex items-center gap-1 truncate">
                    {cities.slice(0, 1).map((c) => (
                      <span key={c} className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        {cityOptions.find((o) => o.value === c)?.label ?? c}
                        <X size={9} weight="bold" className="cursor-pointer hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemoveCity(c); }} />
                      </span>
                    ))}
                    {cities.length > 1 && <span className="text-[11px] text-muted-foreground">+{cities.length - 1}</span>}
                  </span>
                )}
                <CaretDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
              <Command>
                <CommandInput placeholder={t('catalog.city_placeholder')} />
                <CommandList>
                  <CommandEmpty>—</CommandEmpty>
                  <CommandGroup>
                    {cityOptions.map((c) => {
                      const selected = cities.includes(c.value);
                      return (
                        <CommandItem key={c.value} value={c.label} onSelect={() => onToggleCity(c.value)}>
                          <div className={cn('mr-1 flex h-4 w-4 items-center justify-center rounded border border-primary/40', selected ? 'bg-primary border-primary' : 'bg-transparent')}>
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

          {/* Clear filters */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                type="button"
                onClick={onClearFilters}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
              >
                <SlidersHorizontal size={13} />
                <span className="flex h-4 min-w-4 items-center justify-center rounded bg-destructive/15 px-1 text-[10px] font-semibold tabular-nums">{activeFilterCount}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Niche chips */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <NicheChip isActive={!selectedNiche} onClick={() => onNicheChange(undefined)} icon={SquaresFour} label={t('masters.all_categories')} />
          {specialities.map((spec) => {
            const meta = NICHE_META[spec.slug];
            return (
              <NicheChip key={spec.slug} isActive={selectedNiche === spec.slug} onClick={() => onNicheChange(spec.slug)} icon={meta?.icon ?? Sparkle} label={spec.label} />
            );
          })}
        </div>

        {/* Badge chips */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <BadgeFilterChip checked={badgeFilters.isVerified} onToggle={() => onBadgeToggle('isVerified')} icon={SealCheck} label={t('catalog.filter_verified')} colorClass="text-primary" />
          <BadgeFilterChip checked={badgeFilters.isCertified} onToggle={() => onBadgeToggle('isCertified')} icon={Certificate} label={t('catalog.filter_certified')} colorClass="text-primary" />
          <BadgeFilterChip checked={badgeFilters.isHygieneVerified} onToggle={() => onBadgeToggle('isHygieneVerified')} icon={FirstAid} label={t('catalog.filter_hygiene')} colorClass="text-success" />
          <BadgeFilterChip checked={badgeFilters.isQualityProducts} onToggle={() => onBadgeToggle('isQualityProducts')} icon={Diamond} label={t('catalog.filter_quality')} colorClass="text-info" />
          <BadgeFilterChip checked={badgeFilters.isTopRated} onToggle={() => onBadgeToggle('isTopRated')} icon={Star} label={t('catalog.filter_top_rated')} colorClass="text-warning" />
        </div>

        {/* Extra select filters */}
        <div className="flex gap-1.5 flex-wrap">
          <SelectFilterChip value={selectedTier} onChange={onTierChange} label={t('catalog.filter_tier')} options={[
            { value: 'TOP_MASTER', label: t('masters.tier_top_master') },
            { value: 'PROFESSIONAL', label: t('masters.tier_professional') },
            { value: 'INTERMEDIATE', label: t('masters.tier_intermediate') },
            { value: 'JUNIOR', label: t('masters.tier_junior') },
          ]} />
          <SelectFilterChip value={selectedLanguage} onChange={onLanguageChange} label={t('catalog.filter_language')} options={LANGUAGE_OPTIONS} />
          <SelectFilterChip value={selectedLocationType} onChange={onLocationTypeChange} label={t('catalog.filter_location_type')} options={LOCATION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(`catalog.location_${o.value}`) }))} />
          {districts.length > 0 && <SelectFilterChip value={selectedDistrict} onChange={onDistrictChange} label={t('catalog.filter_district')} options={districts.map((d) => ({ value: d.slug, label: d.name }))} />}
          {brands.length > 0 && <SelectFilterChip value={selectedBrand} onChange={onBrandChange} label={t('catalog.filter_brand')} options={brands.map((b) => ({ value: b.slug, label: b.name }))} />}
          {styleTags.length > 0 && <SelectFilterChip value={selectedStyleTag} onChange={onStyleTagChange} label={t('catalog.filter_style_tag')} options={styleTags.map((s) => ({ value: s.slug, label: s.name }))} />}
        </div>

      </div>

      {/* Result count */}
      {!isLoading && (
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-border/40">
          <UsersFour size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('catalog.results_count').replace('{{count}}', String(totalItems))}
          </span>
          {isFetching && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
        </div>
      )}

      {/* Scrollable master list */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        ) : masters.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">{t('catalog.empty_title')}</p>
            {hasActiveFilters && (
              <button type="button" onClick={onClearFilters} className="text-xs text-primary hover:underline">
                {t('catalog.clear_filters')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {masters.map((master) => (
              <CompactMasterCard
                key={master.username}
                master={master}
                isHighlighted={highlightedUsername === master.username}
                onMouseEnter={() => onMasterHover(master.username)}
                onMouseLeave={() => onMasterHover(null)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NicheChip ───────────────────────────────────────────────────────────────

function NicheChip({ isActive, onClick, icon: IconComponent, label }: {
  isActive: boolean; onClick: () => void; icon: Icon; label: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
      )}
    >
      <IconComponent size={13} weight={isActive ? 'fill' : 'regular'} />
      {label}
    </button>
  );
}

// ─── BadgeFilterChip ─────────────────────────────────────────────────────────

function BadgeFilterChip({ checked, onToggle, icon: IconComponent, label, colorClass }: {
  checked: boolean; onToggle: () => void; icon: Icon; label: string; colorClass: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border',
        checked
          ? 'bg-primary/8 text-foreground border-primary/40 shadow-sm'
          : 'bg-background text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
      )}
    >
      <Checkbox
        checked={checked}
        className="pointer-events-none h-3 w-3 rounded-[3px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        tabIndex={-1}
      />
      <IconComponent size={12} weight={checked ? 'fill' : 'regular'} className={checked ? colorClass : ''} />
      {label}
    </button>
  );
}

// ─── SelectFilterChip ────────────────────────────────────────────────────────

function SelectFilterChip({ value, onChange, label, options }: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  label: string;
  options: { value: string; label: string }[];
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border',
            value
              ? 'bg-primary/8 text-foreground border-primary/40 shadow-sm'
              : 'bg-background text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
          )}
        >
          {value ? options.find((o) => o.value === value)?.label ?? label : label}
          <CaretDown size={11} className="text-muted-foreground" />
          {value && (
            <X size={9} weight="bold" className="ml-0.5 cursor-pointer hover:text-destructive" onClick={(e) => { e.stopPropagation(); onChange(undefined); }} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <Command>
          <CommandInput placeholder={label} />
          <CommandList>
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => { onChange(value === opt.value ? undefined : opt.value); setOpen(false); }}
                >
                  <div className={cn('mr-1 flex h-4 w-4 items-center justify-center rounded border border-primary/40', value === opt.value ? 'bg-primary border-primary' : 'bg-transparent')}>
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
