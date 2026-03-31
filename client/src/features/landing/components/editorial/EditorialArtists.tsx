'use client';

import React, { useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { mastersService } from '@/features/masters/services/masters.service';
import { mastersKeys } from '@/features/masters/hooks/useFeaturedMasters';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import type { FeaturedMaster } from '@/features/masters/types/masters.types';

// ─── Placeholder data (shown when API fails or returns empty) ─────────────────

const PLACEHOLDER_MASTERS: FeaturedMaster[] = [
  {
    masterProfileId: null,
    username: 'lela-vardidze',
    displayName: 'Lela Vardidze',
    avatar: null,
    city: 'tbilisi',
    niche: 'lashes-brows',
    portfolioImages: [],
    totalItems: 0,
    masterTier: 'TOP_MASTER',
    isVerified: true,
    badges: {
      isCertified: true,
      isHygieneVerified: true,
      isQualityProducts: true,
      isTopRated: true,
    },
  },
  {
    masterProfileId: null,
    username: 'ani-janelidze',
    displayName: 'Ani Janelidze',
    avatar: null,
    city: 'tbilisi',
    niche: 'lashes-brows',
    portfolioImages: [],
    totalItems: 0,
    masterTier: 'PROFESSIONAL',
    isVerified: true,
    badges: {
      isCertified: true,
      isHygieneVerified: false,
      isQualityProducts: true,
      isTopRated: false,
    },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function isGlowStar(master: FeaturedMaster): boolean {
  return master.masterTier === 'TOP_MASTER';
}

function hasSafety(master: FeaturedMaster): boolean {
  return master.badges?.isHygieneVerified === true;
}

function hasExpert(master: FeaturedMaster): boolean {
  return master.badges?.isCertified === true;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ArtistCardSkeleton(): React.ReactElement {
  return (
    <div className="flex-none w-[280px] lg:w-[320px] snap-center">
      <div className="p-1" style={{ backgroundColor: 'var(--ed-surface-lowest, var(--background))' }}>
        <Skeleton
          className="w-full"
          style={{ aspectRatio: '4/5', height: '350px' }}
        />
        <div className="p-5 flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
      <Skeleton className="w-full h-11 mt-4" />
    </div>
  );
}

// ─── Artist Card ─────────────────────────────────────────────────────────────

interface ArtistCardProps {
  master: FeaturedMaster;
}

function ArtistCard({ master }: ArtistCardProps): React.ReactElement {
  const firstImage = master.portfolioImages[0] ?? null;
  const imageUrl = firstImage
    ? getThumbUrl(firstImage.imageUrl, 400)
    : master.avatar
    ? getThumbUrl(master.avatar, 400)
    : null;

  const glowStar = isGlowStar(master);
  const safety = hasSafety(master);
  const expert = hasExpert(master);

  return (
    <div className="flex-none w-[280px] lg:w-[320px] snap-center group">
      <div
        className="p-1"
        style={{
          backgroundColor: 'var(--ed-surface-lowest, var(--background))',
          boxShadow: '0 2px 20px 0 rgba(0,0,0,0.08)',
        }}
      >
        {/* Portrait image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={master.displayName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width:1024px) 320px, 280px"
              unoptimized
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: 'var(--ed-surface-low, var(--muted))' }}
            >
              <span
                className="text-6xl font-bold"
                style={{ color: 'var(--ed-on-surface-variant, var(--muted-foreground))', opacity: 0.15 }}
              >
                {master.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Top-left badges */}
          {(glowStar || safety || expert) && (
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {glowStar && (
                <span
                  className={cn(
                    'w-fit px-2 py-0.5 rounded-sm',
                    'font-[family-name:var(--font-ed-label)]',
                  )}
                  style={{
                    backgroundColor: 'var(--ed-primary, var(--primary))',
                    color: 'var(--ed-on-primary, var(--primary-foreground))',
                    fontSize: '7px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}
                >
                  ★ GLOW STAR
                </span>
              )}
              {(safety || expert) && (
                <div className="flex gap-1">
                  {safety && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-sm border',
                        'font-[family-name:var(--font-ed-label)]',
                      )}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: 'var(--ed-primary, var(--primary))',
                        borderColor: 'rgba(var(--ed-primary-rgb, 0,0,0), 0.05)',
                        fontSize: '6.5px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Safety
                    </span>
                  )}
                  {expert && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-sm border',
                        'font-[family-name:var(--font-ed-label)]',
                      )}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: 'var(--ed-primary, var(--primary))',
                        borderColor: 'rgba(var(--ed-primary-rgb, 0,0,0), 0.05)',
                        fontSize: '6.5px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Expert
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Name row */}
        <div className="p-5 flex justify-between items-start">
          <div>
            <p
              className="font-[family-name:var(--font-ed-label)] mb-1"
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--ed-on-surface-variant, var(--muted-foreground))',
              }}
            >
              Elite Master
            </p>
            <h3
              className="font-[family-name:var(--font-ed-display)] text-lg leading-tight"
              style={{ color: 'var(--ed-on-surface, var(--foreground))' }}
            >
              {master.displayName}
            </h3>
          </div>
          {/* Arrow icon — diagonal outward */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: 'var(--ed-on-surface-variant, var(--muted-foreground))' }}
            aria-hidden="true"
          >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </div>
      </div>

      {/* "სრულად" button */}
      <Link
        href={ROUTES.PORTFOLIO_PUBLIC(master.username)}
        className={cn(
          'block w-full mt-4 py-3 text-center',
          'font-[family-name:var(--font-ed-label)] transition-all duration-300',
          'border hover:opacity-90 active:scale-[0.98]',
        )}
        style={{
          backgroundColor: 'var(--ed-surface-lowest, var(--background))',
          borderColor: 'color-mix(in oklch, var(--ed-outline-variant, var(--border)) 30%, transparent)',
          color: 'var(--ed-on-surface, var(--foreground))',
          fontSize: '10px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = 'var(--ed-primary, var(--primary))';
          el.style.color = 'var(--ed-on-primary, var(--primary-foreground))';
          el.style.borderColor = 'var(--ed-primary, var(--primary))';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = 'var(--ed-surface-lowest, var(--background))';
          el.style.color = 'var(--ed-on-surface, var(--foreground))';
          el.style.borderColor = 'color-mix(in oklch, var(--ed-outline-variant, var(--border)) 30%, transparent)';
        }}
      >
        სრულად
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EditorialArtists(): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: masters = [], isLoading, isError, isSuccess } = useQuery({
    queryKey: mastersKeys.featured(),
    queryFn: () => mastersService.getFeatured(12),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const showSkeletons = isLoading;
  const showPlaceholders = (isError || (isSuccess && masters.length === 0));
  const displayMasters = showPlaceholders ? PLACEHOLDER_MASTERS : masters;

  const scrollRight = useCallback((): void => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  }, []);

  return (
    <section
      className="py-24 overflow-hidden"
      style={{ backgroundColor: 'var(--ed-surface-low, var(--background))' }}
    >
      {/* Section heading */}
      <div className="px-8 md:px-12 lg:px-16 mb-12 max-w-7xl mx-auto">
        <h2
          className="font-[family-name:var(--font-ed-display)] text-3xl"
          style={{ color: 'var(--ed-on-surface, var(--foreground))' }}
        >
          საუკეთესო მასტერები ერთ სივრცეში
        </h2>
      </div>

      {/* Sub-header row */}
      <div className="mb-6 px-8 md:px-12 lg:px-16 flex justify-between items-end max-w-7xl mx-auto">
        <h3
          className="font-[family-name:var(--font-ed-label)] font-bold"
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: 'var(--ed-primary, var(--primary))',
          }}
        >
          Lash and Brow Top Masters
        </h3>
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll right"
          className="flex items-center justify-center transition-opacity duration-200 hover:opacity-60 active:scale-95 cursor-pointer"
          style={{ color: 'var(--ed-on-surface-variant, var(--muted-foreground))' }}
        >
          {/* chevron_right SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory px-8 md:px-12 lg:px-16 space-x-6 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {showSkeletons
          ? Array.from({ length: 3 }).map((_, i) => (
              <ArtistCardSkeleton key={`sk-${i}`} />
            ))
          : displayMasters.map((master) => (
              <ArtistCard key={master.username} master={master} />
            ))}
      </div>
    </section>
  );
}
