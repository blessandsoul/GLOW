'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedMasters } from '../hooks/useFeaturedMasters';
import { getServerImageUrl, getThumbUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

export function FeaturedMasters(): React.ReactElement | null {
    const { t } = useLanguage();
    const { masters, isLoading, isSuccess } = useFeaturedMasters();
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

    // Only hide when API successfully returned 0 masters
    if (isSuccess && masters.length === 0) return null;

    return (
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-4 mb-16 relative z-20">
            {/* Section header */}
            <div className="flex items-end justify-between mb-8">
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

                {/* Desktop scroll controls */}
                <div className="hidden sm:flex items-center gap-2">
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

            {/* Scrollable cards */}
            <div
                ref={scrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {showSkeletons
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <MasterCardSkeleton key={i} />
                    ))
                    : masters.map((master, index) => (
                        <MasterCard key={master.username} master={master} index={index} />
                    ))}
            </div>
        </section>
    );
}

interface MasterCardProps {
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

function MasterCard({ master, index }: MasterCardProps): React.ReactElement {
    const { t } = useLanguage();
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
                className="group flex w-55 sm:w-65 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-border/80"
            >
                {/* Image grid — 2x2 mosaic */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                    {images.length >= 4 ? (
                        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-px">
                            {images.slice(0, 4).map((img) => (
                                <div key={img.id} className="relative overflow-hidden">
                                    <Image
                                        src={getThumbUrl(img.imageUrl, 256)}
                                        alt={img.title ?? ''}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="130px"
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
                                        sizes="260px"
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
                    {/* Avatar */}
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

                    {/* Arrow */}
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
