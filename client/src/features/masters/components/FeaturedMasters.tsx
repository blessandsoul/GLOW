'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    MapPin, ArrowRight, CaretLeft, CaretRight,
    Eye, HandPalm, PaintBrush, Scissors, Drop, Sparkle, SquaresFour,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedMasters } from '../hooks/useFeaturedMasters';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { getThumbUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { getCityLabel } from '@/lib/constants/cities';
import { MasterBadgesRow } from './MasterBadges';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { useFavoriteStatus } from '@/features/favorites/hooks/useFavorites';
import { useAppSelector } from '@/store/hooks';

const NICHE_META: Record<string, { icon: Icon }> = {
    'lashes-brows': { icon: Eye },
    nails:    { icon: HandPalm },
    makeup:   { icon: PaintBrush },
    hair:     { icon: Scissors },
    skincare: { icon: Drop },
};

export function FeaturedMasters(): React.ReactElement | null {
    const { t, language } = useLanguage();
    const [selectedNiche, setSelectedNiche] = useState<string | undefined>(undefined);
    const { specialities } = useSpecialities();
    const { masters, isLoading, isSuccess } = useFeaturedMasters(selectedNiche);
    const scrollRef = useRef<HTMLDivElement>(null);
    const showSkeletons = isLoading || (!isSuccess && masters.length === 0);

    const scroll = useCallback((direction: 'left' | 'right'): void => {
        if (!scrollRef.current) return;
        const cardWidth = 260;
        const gap = 16;
        const scrollAmount = (cardWidth + gap) * 2;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    const handleNicheChange = useCallback((niche: string | undefined): void => {
        setSelectedNiche(niche);
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
    }, []);

    if (isSuccess && masters.length === 0 && !selectedNiche) return null;

    return (
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-4 mb-16 relative z-20">
            {/* Section header */}
            <div className="flex items-end justify-between mb-6">
                <div>
                    <motion.h2
                        className="text-2xl font-semibold tracking-tight text-foreground"
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {t('masters.section_title')}
                    </motion.h2>
                    <motion.p
                        className="mt-1.5 text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {t('masters.section_subtitle')}
                    </motion.p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={ROUTES.MASTERS}
                        className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                    >
                        {t('masters.view_all')}
                        <ArrowRight size={14} weight="bold" />
                    </Link>

                    <div className="hidden sm:flex items-center gap-2 ml-4">
                        <button
                            type="button"
                            onClick={() => scroll('left')}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground hover:shadow-sm active:scale-95 cursor-pointer"
                            aria-label={t('masters.scroll_left')}
                        >
                            <CaretLeft size={16} weight="bold" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll('right')}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground hover:shadow-sm active:scale-95 cursor-pointer"
                            aria-label={t('masters.scroll_right')}
                        >
                            <CaretRight size={16} weight="bold" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category filter chips */}
            {specialities.length > 0 && (
                <motion.div
                    className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 }}
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
                </motion.div>
            )}

            {/* Scrollable cards */}
            <div
                ref={scrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <AnimatePresence mode="popLayout">
                    {showSkeletons
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <MasterCardSkeleton key={`sk-${i}`} />
                        ))
                        : masters.length === 0 ? (
                            <motion.div
                                key="empty"
                                className="flex w-full items-center justify-center py-12"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <p className="text-sm text-muted-foreground">{t('masters.no_results')}</p>
                            </motion.div>
                        ) : masters.map((master, index) => (
                            <MasterCard key={master.username} master={master} index={index} />
                        ))}
                </AnimatePresence>
            </div>

            {/* Mobile view all link */}
            <div className="flex sm:hidden justify-center mt-2">
                <Link
                    href={ROUTES.MASTERS}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                >
                    {t('masters.view_all')}
                    <ArrowRight size={14} weight="bold" />
                </Link>
            </div>
        </section>
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
                    : 'bg-card text-muted-foreground border-border/60 hover:border-border hover:text-foreground hover:shadow-sm',
            )}
        >
            <IconComponent size={15} weight={isActive ? 'fill' : 'regular'} />
            {label}
        </button>
    );
}

// ─── Master Card ─────────────────────────────────────────────────────────────

interface MasterCardProps {
    master: {
        masterProfileId: string | null;
        username: string;
        displayName: string;
        avatar: string | null;
        city: string | null;
        niche: string | null;
        portfolioImages: { id: string; imageUrl: string; title: string | null }[];
        totalItems: number;
        favoritesCount?: number;
        masterTier?: string;
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
}

function MasterCard({ master, index }: MasterCardProps): React.ReactElement {
    const { language } = useLanguage();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const masterIds = master.masterProfileId ? [master.masterProfileId] : [];
    const { status } = useFavoriteStatus(masterIds, []);
    const isFavorited = master.masterProfileId ? status?.masters[master.masterProfileId] ?? false : false;
    const images = master.portfolioImages;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
        >
            <Link
                href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
                className="group flex w-64 shrink-0 snap-start flex-col rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-border/80"
            >
                {/* Image grid */}
                <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-muted/30 p-1.5">
                    {images.length >= 4 ? (
                        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1.5">
                            {images.slice(0, 4).map((img) => (
                                <div key={img.id} className="relative overflow-hidden rounded-lg">
                                    <Image
                                        src={getThumbUrl(img.imageUrl, 256)}
                                        alt={img.title ?? ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="100px"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    ) : images.length > 0 ? (
                        <div className={cn(
                            'grid h-full w-full gap-1.5',
                            images.length === 1 && 'grid-cols-1',
                            images.length === 2 && 'grid-cols-2',
                            images.length === 3 && 'grid-cols-2 grid-rows-2',
                        )}>
                            {images.map((img, i) => (
                                <div
                                    key={img.id}
                                    className={cn(
                                        'relative overflow-hidden rounded-lg',
                                        images.length === 3 && i === 0 && 'row-span-2',
                                    )}
                                >
                                    <Image
                                        src={getThumbUrl(img.imageUrl, 256)}
                                        alt={img.title ?? ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="100px"
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
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                            <span>+</span>
                            <span className="tabular-nums">{master.totalItems - 4}</span>
                        </div>
                    )}

                    {isAuthenticated && master.masterProfileId && (
                        <div className="absolute right-2 top-2 z-10">
                            <FavoriteButton
                                entityType="master"
                                entityId={master.masterProfileId}
                                isFavorited={isFavorited}
                                favoritesCount={master.favoritesCount}
                            />
                        </div>
                    )}
                </div>

                {/* Master info */}
                <div className="flex items-center gap-3 p-3.5">
                    {master.avatar ? (
                        <Image
                            src={getThumbUrl(master.avatar, 96)}
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
                        <MasterBadgesRow masterTier={master.masterTier} isVerified={master.isVerified} badges={master.badges} />
                        <div className="flex items-center gap-2 mt-0.5">
                            {master.city && (
                                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground truncate">
                                    <MapPin size={10} weight="fill" className="shrink-0" />
                                    {getCityLabel(master.city, language)}
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

function MasterCardSkeleton(): React.ReactElement {
    return (
        <div className="w-55 sm:w-65 shrink-0 snap-start overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
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
