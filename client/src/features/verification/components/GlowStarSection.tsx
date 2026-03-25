'use client';

import { useState, useCallback, useEffect } from 'react';
import { Trophy, Star, SpinnerGap, CheckCircle, Clock, XCircle, Eye, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useGlowStarState, useRequestGlowStar } from '../hooks/useVerification';
import { usePortfolioPreview } from '@/features/profile/hooks/usePortfolioPreview';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';

const PORTFOLIO_THRESHOLD = 10;
const GLOW_STAR_REVIEW_SEEN_KEY = 'glowstar-review-seen';

function UnderReviewPopup({ onClose }: { onClose: () => void }): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
                role="presentation"
            />
            <div className="relative w-full max-w-md rounded-2xl border border-info/30 bg-card p-6 shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-info/15">
                        <Trophy size={28} weight="fill" className="text-info" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                        {t('glow_star.popup_title')}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t('glow_star.popup_message')}
                    </p>
                    <Button
                        onClick={onClose}
                        className="mt-6 w-full gap-2 bg-info text-info-foreground hover:bg-info/90"
                    >
                        <CheckCircle size={16} weight="fill" />
                        {t('glow_star.popup_ok')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function GlowStarSection(): React.ReactElement | null {
    const user = useAppSelector((s) => s.auth.user);
    const { t } = useLanguage();
    const { state, isLoading } = useGlowStarState();
    const { request, isPending } = useRequestGlowStar();
    const { publishedCount } = usePortfolioPreview();
    const { profile } = useProfile();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const glowStarStatus = state?.glowStarStatus ?? 'NONE';

    // Show popup once when status is UNDER_REVIEW and user hasn't seen it yet
    useEffect(() => {
        if (glowStarStatus === 'UNDER_REVIEW') {
            const seen = localStorage.getItem(GLOW_STAR_REVIEW_SEEN_KEY);
            if (!seen) {
                setShowPopup(true);
            }
        }
        // Clear the seen flag if status is no longer UNDER_REVIEW (e.g. rejected, re-requested)
        if (glowStarStatus === 'NONE' || glowStarStatus === 'REJECTED') {
            localStorage.removeItem(GLOW_STAR_REVIEW_SEEN_KEY);
        }
    }, [glowStarStatus]);

    const handleClosePopup = useCallback((): void => {
        localStorage.setItem(GLOW_STAR_REVIEW_SEEN_KEY, 'true');
        setShowPopup(false);
    }, []);

    // Only show for masters and admins
    if (!user || (user.role !== 'MASTER' && user.role !== 'ADMIN')) return null;

    if (isLoading) {
        return (
            <section className="rounded-xl border border-border/50 bg-card p-6">
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
            </section>
        );
    }

    // Already Top Master
    if (state?.masterTier === 'TOP_MASTER') return null;

    const hasPortfolio = publishedCount >= PORTFOLIO_THRESHOLD;
    const hasInstagram = !!profile?.instagram;
    const hasProfile = !!(profile?.city && profile?.niche && profile?.services);

    const canRequest = hasPortfolio && hasInstagram && hasProfile && glowStarStatus === 'NONE';

    const handleConfirm = useCallback((): void => {
        request();
        setShowConfirm(false);
    }, [request]);

    return (
        <>
            {showPopup && <UnderReviewPopup onClose={handleClosePopup} />}

            <section className="rounded-xl border border-warning/30 bg-gradient-to-br from-warning/5 to-transparent p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15">
                        <Trophy size={20} weight="fill" className="text-warning" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{t('glow_star.title')}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">{t('glow_star.subtitle')}</p>
                    </div>
                </div>

                {/* Status display */}
                {glowStarStatus === 'REQUESTED' && (
                    <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-3">
                        <Clock size={16} weight="fill" className="text-warning" />
                        <span className="text-sm font-medium text-warning">{t('glow_star.status_pending')}</span>
                    </div>
                )}

                {glowStarStatus === 'UNDER_REVIEW' && (
                    <div className="flex items-start gap-2 rounded-lg bg-info/10 px-4 py-3">
                        <Eye size={16} weight="fill" className="mt-0.5 shrink-0 text-info" />
                        <div>
                            <span className="text-sm font-medium text-info">{t('glow_star.status_under_review')}</span>
                            <p className="mt-1 text-xs text-muted-foreground">{t('glow_star.status_under_review_detail')}</p>
                        </div>
                    </div>
                )}

                {glowStarStatus === 'APPROVED' && (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
                        <CheckCircle size={16} weight="fill" className="text-success" />
                        <span className="text-sm font-medium text-success">{t('glow_star.status_approved')}</span>
                    </div>
                )}

                {glowStarStatus === 'REJECTED' && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3">
                        <XCircle size={16} weight="fill" className="text-destructive" />
                        <span className="text-sm font-medium text-destructive">{t('glow_star.status_rejected')}</span>
                    </div>
                )}

                {/* Requirements (only when NONE) */}
                {glowStarStatus === 'NONE' && (
                    <>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('glow_star.requirements')}
                            </p>
                            <ul className="space-y-1.5">
                                {[
                                    { label: t('glow_star.req_portfolio').replace('{count}', String(publishedCount)), met: hasPortfolio },
                                    { label: t('glow_star.req_profile'), met: hasProfile },
                                    { label: t('glow_star.req_instagram'), met: hasInstagram },
                                ].map((req) => (
                                    <li key={req.label} className="flex items-center gap-2">
                                        {req.met ? (
                                            <CheckCircle size={14} weight="fill" className="shrink-0 text-success" />
                                        ) : (
                                            <XCircle size={14} weight="fill" className="shrink-0 text-destructive" />
                                        )}
                                        <span className={cn('text-sm', req.met ? 'text-foreground' : 'text-muted-foreground')}>
                                            {req.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {!showConfirm ? (
                            <Button
                                onClick={() => setShowConfirm(true)}
                                disabled={!canRequest}
                                className="w-full gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
                            >
                                <Star size={16} weight="fill" />
                                {t('glow_star.request_button')}
                            </Button>
                        ) : (
                            <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                                <p className="text-sm text-foreground">{t('glow_star.confirm_text')}</p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleConfirm}
                                        disabled={isPending}
                                        className="flex-1 gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
                                    >
                                        {isPending && <SpinnerGap size={14} className="animate-spin" />}
                                        {t('glow_star.confirm_yes')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isPending}
                                        className="flex-1"
                                    >
                                        {t('glow_star.confirm_cancel')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
