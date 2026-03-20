'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SealCheck, Certificate, FirstAid, Diamond, Star, Trophy, Medal, ShieldCheck } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { MasterBadges, MasterTier } from '../types/masters.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MasterBadgesRowProps {
    masterTier?: string;
    isVerified?: boolean;
    badges?: MasterBadges;
    size?: 'sm' | 'md';
}

interface BadgeItemProps {
    icon: Icon;
    label: string;
    colorClass: string;
    size: 'sm' | 'md';
}

// ─── Badge Item ───────────────────────────────────────────────────────────────

function BadgeItem({ icon: IconComponent, label, colorClass, size }: BadgeItemProps): React.ReactElement {
    const [showTooltip, setShowTooltip] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
    const iconSize = size === 'sm' ? 11 : 13;
    const containerSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

    const handleClick = useCallback((e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setShowTooltip((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!showTooltip || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        setTooltipPos({
            top: rect.top - 6,
            left: rect.left + rect.width / 2,
        });

        const handleOutside = (e: MouseEvent | TouchEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setShowTooltip(false);
            }
        };

        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);

        const timer = setTimeout(() => setShowTooltip(false), 3000);

        return (): void => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            clearTimeout(timer);
        };
    }, [showTooltip]);

    return (
        <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className="group/badge relative"
            aria-label={label}
        >
            <div
                className={cn(
                    'flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-110',
                    containerSize,
                    colorClass,
                )}
            >
                <IconComponent size={iconSize} weight="fill" />
            </div>
            {showTooltip && tooltipPos && createPortal(
                <div
                    className="pointer-events-none fixed z-9999 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background animate-in fade-in duration-150"
                    style={{ top: tooltipPos.top, left: tooltipPos.left }}
                >
                    {label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-foreground" />
                </div>,
                document.body,
            )}
        </button>
    );
}

// ─── Master Badges Row ────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { icon: Icon; label: string; colorClass: string } | null> = {
    TOP_MASTER: { icon: Trophy, label: 'masters.tier_top_master', colorClass: 'bg-warning/15 text-warning' },
    PROFESSIONAL: { icon: Medal, label: 'masters.tier_professional', colorClass: 'bg-primary/15 text-primary' },
    INTERMEDIATE: { icon: ShieldCheck, label: 'masters.tier_intermediate', colorClass: 'bg-info/15 text-info' },
    JUNIOR: null,
};

export function MasterBadgesRow({ masterTier, isVerified, badges, size = 'sm' }: MasterBadgesRowProps): React.ReactElement | null {
    const { t } = useLanguage();
    const activeBadges: { icon: Icon; label: string; colorClass: string }[] = [];

    // Tier badge first (skip JUNIOR — it's the default)
    if (masterTier && TIER_CONFIG[masterTier]) {
        const tierCfg = TIER_CONFIG[masterTier]!;
        activeBadges.push({
            icon: tierCfg.icon,
            label: t(tierCfg.label),
            colorClass: tierCfg.colorClass,
        });
    }

    if (isVerified) {
        activeBadges.push({
            icon: SealCheck,
            label: t('masters.badge_verified'),
            colorClass: 'bg-primary/15 text-primary',
        });
    }
    if (badges?.isCertified) {
        activeBadges.push({
            icon: Certificate,
            label: t('masters.badge_certified'),
            colorClass: 'bg-primary/15 text-primary',
        });
    }
    if (badges?.isHygieneVerified) {
        activeBadges.push({
            icon: FirstAid,
            label: t('masters.badge_hygiene'),
            colorClass: 'bg-success/15 text-success',
        });
    }
    if (badges?.isQualityProducts) {
        activeBadges.push({
            icon: Diamond,
            label: t('masters.badge_quality_products'),
            colorClass: 'bg-info/15 text-info',
        });
    }
    if (badges?.isTopRated) {
        activeBadges.push({
            icon: Star,
            label: t('masters.badge_top_rated'),
            colorClass: 'bg-warning/15 text-warning',
        });
    }

    if (activeBadges.length === 0) return null;

    return (
        <div className="flex items-center gap-1">
            {activeBadges.map((badge, i) => (
                <BadgeItem key={i} {...badge} size={size} />
            ))}
        </div>
    );
}
