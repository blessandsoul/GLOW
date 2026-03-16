'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SealCheck, Certificate, FirstAid, Diamond, Star } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { MasterBadges } from '../types/masters.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MasterBadgesRowProps {
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
    const iconSize = size === 'sm' ? 11 : 13;
    const containerSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

    const handleClick = useCallback((e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setShowTooltip((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!showTooltip) return;

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
            <div
                className={cn(
                    'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background transition-opacity duration-150 z-50',
                    showTooltip ? 'opacity-100' : 'opacity-0 group-hover/badge:opacity-100',
                )}
            >
                {label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-foreground" />
            </div>
        </button>
    );
}

// ─── Master Badges Row ────────────────────────────────────────────────────────

export function MasterBadgesRow({ isVerified, badges, size = 'sm' }: MasterBadgesRowProps): React.ReactElement | null {
    const { t } = useLanguage();
    const activeBadges: { icon: Icon; label: string; colorClass: string }[] = [];

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
