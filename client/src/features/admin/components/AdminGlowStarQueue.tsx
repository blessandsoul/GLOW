'use client';

import React, { useState, useCallback } from 'react';
import {
    Trophy, CheckCircle, XCircle, User, CaretLeft, CaretRight, SpinnerGap, InstagramLogo, Eye,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { getServerImageUrl } from '@/lib/utils/image';
import { useAdminGlowStarRequests, useAdminReviewGlowStar } from '@/features/verification/hooks/useVerification';
import { useLanguage } from '@/i18n/hooks/useLanguage';

const LIMIT = 10;

function RequestCard({ request }: {
    request: {
        userId: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        niche: string | null;
        city: string | null;
        instagram: string | null;
        masterTier: string;
        glowStarStatus: string;
        glowStarRequestedAt: string | null;
    };
}): React.ReactElement {
    const { t } = useLanguage();
    const { review, isPending } = useAdminReviewGlowStar();
    const initials = `${(request.firstName ?? '')[0] ?? ''}${(request.lastName ?? '')[0] ?? ''}`.toUpperCase();
    const isUnderReview = request.glowStarStatus === 'UNDER_REVIEW';

    return (
        <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-md">
            <div className="flex items-start gap-4">
                <div className="shrink-0">
                    {request.avatar ? (
                        <img src={getServerImageUrl(request.avatar)} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-sm font-semibold text-warning">
                            {initials || <User size={20} />}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{request.firstName} {request.lastName}</span>
                        {isUnderReview && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-semibold text-info">
                                <Eye size={10} weight="fill" />
                                {t('glow_star.status_under_review_badge')}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {request.niche && <span>{request.niche}</span>}
                        {request.city && <span>{request.city}</span>}
                        {request.instagram && (
                            <a
                                href={`https://instagram.com/${request.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <InstagramLogo size={12} />
                                {request.instagram}
                            </a>
                        )}
                        {request.glowStarRequestedAt && (
                            <span>{new Date(request.glowStarRequestedAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                {isUnderReview ? (
                    <Button
                        size="sm"
                        onClick={() => review({ userId: request.userId, action: 'approve' })}
                        disabled={isPending}
                        className="gap-1.5 bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                        {isPending ? <SpinnerGap size={14} className="animate-spin" /> : <Trophy size={14} weight="fill" />}
                        {t('glow_star.admin_grant')}
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={() => review({ userId: request.userId, action: 'accept' })}
                        disabled={isPending}
                        className="gap-1.5 bg-info text-info-foreground hover:bg-info/90"
                    >
                        {isPending ? <SpinnerGap size={14} className="animate-spin" /> : <CheckCircle size={14} weight="fill" />}
                        {t('glow_star.admin_accept')}
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => review({ userId: request.userId, action: 'reject' })}
                    disabled={isPending}
                >
                    {isPending ? <SpinnerGap size={14} className="animate-spin" /> : <XCircle size={14} weight="fill" />}
                    {t('glow_star.admin_reject')}
                </Button>
            </div>
        </div>
    );
}

export function AdminGlowStarQueue(): React.ReactElement {
    const { t } = useLanguage();
    const [page, setPage] = useState(1);
    const { requests, pagination, isLoading } = useAdminGlowStarRequests(page, LIMIT);

    const totalPages = pagination?.totalPages ?? 1;

    return (
        <section className="rounded-xl border border-warning/30 bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border/50 px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
                    <Trophy size={16} weight="fill" className="text-warning" />
                </div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {t('glow_star.admin_title')}
                </h2>
                {(pagination?.totalItems ?? 0) > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/20 px-1.5 text-xs font-semibold tabular-nums text-warning">
                        {pagination!.totalItems}
                    </span>
                )}
            </div>

            <div className="p-5">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Trophy size={36} className="mb-3 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">{t('glow_star.admin_empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <RequestCard key={req.userId} request={req} />
                        ))}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-muted-foreground">
                                    {page} / {totalPages}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1} className="h-8 w-8 p-0">
                                        <CaretLeft size={14} />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="h-8 w-8 p-0">
                                        <CaretRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
