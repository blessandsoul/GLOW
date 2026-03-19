'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useFavoritePortfolioItems } from '../hooks/useFavorites';
import { getThumbUrl } from '@/lib/utils/image';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import type { FavoritePortfolioItemItem } from '../types/favorites.types';

const LIMIT = 10;

export function FavoritePortfolioGrid(): React.ReactElement {
    const [page, setPage] = useState(1);
    const { items, pagination, isLoading } = useFavoritePortfolioItems(page, LIMIT);

    if (isLoading) {
        return <PortfolioGridSkeleton />;
    }

    if (!items || items.length === 0) {
        return <PortfolioEmptyState />;
    }

    return (
        <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                    <FavoritePortfolioCard key={item.id} item={item} />
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

// ─── Portfolio Card ───────────────────────────────────────────────────────────

interface FavoritePortfolioCardProps {
    item: FavoritePortfolioItemItem;
}

function FavoritePortfolioCard({ item }: FavoritePortfolioCardProps): React.ReactElement {
    const { portfolioItem } = item;
    const masterName = `${portfolioItem.user.firstName} ${portfolioItem.user.lastName}`.trim();

    return (
        <Link
            href={ROUTES.PORTFOLIO_PUBLIC(portfolioItem.user.username)}
            className="group relative flex flex-col rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-border/80 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                <Image
                    src={getThumbUrl(portfolioItem.imageUrl, 400)}
                    alt={portfolioItem.title ?? masterName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/10" />

                {/* Heart count badge */}
                {portfolioItem._count.favoritedBy > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm tabular-nums">
                        <Heart size={10} weight="fill" />
                        {portfolioItem._count.favoritedBy}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-0.5 p-3">
                {portfolioItem.title && (
                    <p className="truncate text-xs font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        {portfolioItem.title}
                    </p>
                )}
                <p className="truncate text-[11px] text-muted-foreground">
                    {masterName}
                </p>
            </div>
        </Link>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function PortfolioEmptyState(): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Heart size={28} weight="fill" className="text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">No favorite works yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
                Browse portfolio works and tap the heart to save your favorites here.
            </p>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PortfolioGridSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="aspect-square w-full animate-pulse bg-muted" />
                    <div className="p-3 space-y-1.5">
                        <div className="h-3 w-3/4 animate-pulse rounded-md bg-muted" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded-md bg-muted" />
                    </div>
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
