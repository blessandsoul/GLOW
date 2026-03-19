'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, SealCheck, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useFavoriteMasters } from '../hooks/useFavorites';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import type { FavoriteMasterItem } from '../types/favorites.types';

const LIMIT = 10;

export function FavoriteMastersGrid(): React.ReactElement {
    const [page, setPage] = useState(1);
    const { items, pagination, isLoading } = useFavoriteMasters(page, LIMIT);

    if (isLoading) {
        return <MastersGridSkeleton />;
    }

    if (!items || items.length === 0) {
        return <MastersEmptyState />;
    }

    return (
        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <FavoriteMasterCard key={item.id} item={item} />
                ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <PaginationBar
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}

// ─── Master Card ──────────────────────────────────────────────────────────────

interface FavoriteMasterCardProps {
    item: FavoriteMasterItem;
}

function FavoriteMasterCard({ item }: FavoriteMasterCardProps): React.ReactElement {
    const { masterProfile } = item;
    const { user, city, niche, verificationStatus, isCertified, _count } = masterProfile;
    const displayName = `${user.firstName} ${user.lastName}`.trim();
    const isVerified = verificationStatus === 'verified';

    return (
        <Link
            href={ROUTES.PORTFOLIO_PUBLIC(user.username)}
            className="group relative flex flex-col rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-border/80 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
            {/* Avatar header */}
            <div className="flex items-center gap-3 p-4 pb-3">
                {user.avatar ? (
                    <Image
                        src={getThumbUrl(user.avatar, 96)}
                        alt={displayName}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-background"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary ring-2 ring-background">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                            {displayName}
                        </p>
                        {isVerified && (
                            <SealCheck
                                size={15}
                                weight="fill"
                                className="shrink-0 text-primary"
                                aria-label="Verified"
                            />
                        )}
                        {isCertified && !isVerified && (
                            <SealCheck
                                size={15}
                                weight="fill"
                                className="shrink-0 text-info"
                                aria-label="Certified"
                            />
                        )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between gap-2 px-4 pb-4">
                <div className="flex items-center gap-2 min-w-0">
                    {city && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin size={11} weight="fill" className="shrink-0" />
                            {city}
                        </span>
                    )}
                    {city && niche && <span className="text-border text-xs">·</span>}
                    {niche && (
                        <span className="truncate text-xs text-muted-foreground">{niche}</span>
                    )}
                </div>

                {_count.favoritedBy > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/8 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary">
                        <Heart size={11} weight="fill" />
                        {_count.favoritedBy}
                    </span>
                )}
            </div>
        </Link>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function MastersEmptyState(): React.ReactElement {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Heart size={28} weight="fill" className="text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">{t('favorites.masters_empty_title')}</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
                {t('favorites.masters_empty_desc')}
            </p>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MastersGridSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-border/50 bg-card p-4"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 shrink-0 rounded-full animate-pulse bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-28 animate-pulse rounded-md bg-muted" />
                            <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
                        </div>
                    </div>
                    <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
                </div>
            ))}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationBarProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function PaginationBar({ page, totalPages, onPageChange }: PaginationBarProps): React.ReactElement {
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
                aria-label="Previous page"
            >
                <CaretLeft size={16} weight="bold" />
            </button>

            <span className="text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
            </span>

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
                aria-label="Next page"
            >
                <CaretRight size={16} weight="bold" />
            </button>
        </div>
    );
}
