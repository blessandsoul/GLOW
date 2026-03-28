'use client';

import React from 'react';
import { CheckCircle, Clock, XCircle, ShieldCheck, Certificate, SprayBottle, Sparkle, Trophy } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { useVerificationState, useGlowStarState } from '@/features/verification/hooks/useVerification';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';

type BadgeStatus = 'earned' | 'pending' | 'rejected' | 'none';

interface BadgeItem {
    id: string;
    nameKey: string;
    descKey: string;
    icon: React.ElementType;
    status: BadgeStatus;
    anchorId: string;
}

function BadgeCard({ badge, t }: { badge: BadgeItem; t: (key: string) => string }): React.ReactElement {
    const Icon = badge.icon;

    const isEarned = badge.status === 'earned';
    const isPending = badge.status === 'pending';
    const isRejected = badge.status === 'rejected';
    const isNone = badge.status === 'none';

    return (
        <div className={cn(
            'relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200',
            isEarned
                ? 'border-success/30 bg-success/5'
                : isPending
                    ? 'border-warning/30 bg-warning/5'
                    : isRejected
                        ? 'border-destructive/20 bg-destructive/5'
                        : 'border-border/40 bg-muted/20',
        )}>
            {/* Icon + status indicator */}
            <div className="flex items-start justify-between">
                <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    isEarned ? 'bg-success/15' : isPending ? 'bg-warning/15' : isRejected ? 'bg-destructive/10' : 'bg-muted/60',
                )}>
                    <Icon
                        size={18}
                        weight="fill"
                        className={cn(
                            isEarned ? 'text-success' : isPending ? 'text-warning' : isRejected ? 'text-destructive' : 'text-muted-foreground/50',
                        )}
                    />
                </div>

                {isEarned && (
                    <CheckCircle size={16} weight="fill" className="text-success" />
                )}
                {isPending && (
                    <Clock size={16} weight="fill" className="text-warning" />
                )}
                {isRejected && (
                    <XCircle size={16} weight="fill" className="text-destructive" />
                )}
            </div>

            {/* Name */}
            <div className="space-y-0.5">
                <p className={cn(
                    'text-sm font-semibold',
                    isEarned ? 'text-foreground' : 'text-muted-foreground',
                )}>
                    {t(badge.nameKey)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(badge.descKey)}
                </p>
            </div>

            {/* Status label or activate button */}
            {isEarned && (
                <span className="self-start rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                    {t('ui.profile_badge_earned')}
                </span>
            )}
            {isPending && (
                <span className="self-start rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                    {t('ui.profile_badge_pending')}
                </span>
            )}
            {isRejected && (
                <a
                    href={`#${badge.anchorId}`}
                    className="self-start rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-0.5 text-[11px] font-semibold text-destructive transition-colors duration-150 hover:bg-destructive/10"
                >
                    {t('ui.profile_badge_activate')}
                </a>
            )}
            {isNone && (
                <a
                    href={`#${badge.anchorId}`}
                    className="self-start rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary transition-colors duration-150 hover:bg-primary/10"
                >
                    {t('ui.profile_badge_activate')}
                </a>
            )}
        </div>
    );
}

interface BadgesSectionProps {
    onHasPendingChange?: (hasPending: boolean) => void;
}

export function BadgesSection({ onHasPendingChange }: BadgesSectionProps): React.ReactElement | null {
    const user = useAppSelector((s) => s.auth.user);
    const { t } = useLanguage();
    const { state: verificationState, isLoading: verificationLoading } = useVerificationState();
    const { state: glowStarState, isLoading: glowStarLoading } = useGlowStarState();

    React.useEffect(() => {
        if (!verificationState || !glowStarState) return;
        const hasPending =
            verificationState.verificationStatus !== 'VERIFIED' ||
            !verificationState.isCertified ||
            !verificationState.isHygieneVerified ||
            !verificationState.isQualityProducts ||
            glowStarState.masterTier !== 'TOP_MASTER';
        onHasPendingChange?.(hasPending);
    }, [verificationState, glowStarState, onHasPendingChange]);

    if (!user || (user.role !== 'MASTER' && user.role !== 'ADMIN')) return null;

    if (verificationLoading || glowStarLoading) {
        return (
            <section className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t('ui.profile_badges_title')}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/60" />
                    ))}
                </div>
            </section>
        );
    }

    const verStatus = verificationState?.verificationStatus ?? 'NONE';

    const getVerificationStatus = (): BadgeStatus => {
        if (verStatus === 'VERIFIED') return 'earned';
        if (verStatus === 'PENDING') return 'pending';
        if (verStatus === 'REJECTED') return 'rejected';
        return 'none';
    };

    const getBadgeStatus = (earned: boolean): BadgeStatus => earned ? 'earned' : 'none';

    const glowStarStatus = glowStarState?.glowStarStatus ?? 'NONE';
    const getGlowStarStatus = (): BadgeStatus => {
        if (glowStarState?.masterTier === 'TOP_MASTER') return 'earned';
        if (glowStarStatus === 'REQUESTED' || glowStarStatus === 'UNDER_REVIEW') return 'pending';
        if (glowStarStatus === 'REJECTED') return 'rejected';
        return 'none';
    };

    const badges: BadgeItem[] = [
        {
            id: 'verified',
            nameKey: 'ui.profile_badge_verified_name',
            descKey: 'verification.subtitle',
            icon: ShieldCheck,
            status: getVerificationStatus(),
            anchorId: 'section-verification',
        },
        {
            id: 'certified',
            nameKey: 'ui.profile_badge_certified_name',
            descKey: 'verification.certified_desc',
            icon: Certificate,
            status: getBadgeStatus(verificationState?.isCertified ?? false),
            anchorId: 'section-verification',
        },
        {
            id: 'hygiene',
            nameKey: 'ui.profile_badge_hygiene_name',
            descKey: 'verification.hygiene_desc',
            icon: SprayBottle,
            status: getBadgeStatus(verificationState?.isHygieneVerified ?? false),
            anchorId: 'section-verification',
        },
        {
            id: 'quality',
            nameKey: 'ui.profile_badge_quality_name',
            descKey: 'verification.quality_desc',
            icon: Sparkle,
            status: getBadgeStatus(verificationState?.isQualityProducts ?? false),
            anchorId: 'section-verification',
        },
        {
            id: 'glow-star',
            nameKey: 'ui.profile_badge_glow_star_name',
            descKey: 'glow_star.subtitle',
            icon: Trophy,
            status: getGlowStarStatus(),
            anchorId: 'section-glow-star',
        },
    ];

    return (
        <section className="space-y-4">
            <p className="text-sm font-semibold text-foreground">{t('ui.profile_badges_title')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} t={t} />
                ))}
            </div>
        </section>
    );
}
