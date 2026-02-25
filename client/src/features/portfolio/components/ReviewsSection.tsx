'use client';

import { Star, UserCircle } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { PublicReview } from '../types/portfolio.types';

interface ReviewsSectionProps {
    reviews: PublicReview[];
    averageRating: number;
    reviewsCount: number;
}

function formatRelativeDate(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;

    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;

    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m`;
    if (diff < day) return `${Math.floor(diff / hour)}h`;
    if (diff < week) return `${Math.floor(diff / day)}d`;
    if (diff < month) return `${Math.floor(diff / week)}w`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

function StarRating({ rating }: { rating: number }): React.ReactElement {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    size={12}
                    weight={i < rating ? 'fill' : 'regular'}
                    className={i < rating ? 'text-warning' : 'text-muted-foreground/30'}
                />
            ))}
        </div>
    );
}

export function ReviewsSection({ reviews, averageRating, reviewsCount }: ReviewsSectionProps): React.ReactElement | null {
    const { t } = useLanguage();

    if (reviewsCount === 0) return null;

    return (
        <section className="space-y-4">
            {/* Header with aggregate stats */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t('portfolio.reviews_title')}</h2>
                <div className="flex items-center gap-1.5">
                    <Star size={14} weight="fill" className="text-warning" />
                    <span className="text-sm font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({reviewsCount})</span>
                </div>
            </div>

            {/* Review cards */}
            {reviews.length > 0 ? (
                <div className="space-y-3">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-xl border border-border/50 bg-card px-4 py-3.5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                        <UserCircle size={20} className="text-muted-foreground" weight="fill" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {review.clientName || t('portfolio.anonymous')}
                                        </p>
                                        <StarRating rating={review.rating} />
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatRelativeDate(review.createdAt)}
                                </span>
                            </div>
                            {review.text && (
                                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                                    {review.text}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
