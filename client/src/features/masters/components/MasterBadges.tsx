'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Star, StarFour, FirstAid } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { MasterBadges } from '../types/masters.types';

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

export function MasterBadgesRow({ badges, size = 'sm' }: MasterBadgesRowProps): React.ReactElement | null {
    const activeBadges: { icon: Icon; label: string; colorClass: string }[] = [];

    // 1. Glow.Star
    if (badges?.isTopRated) {
        activeBadges.push({
            icon: Star,
            label: 'Glow.Star',
            colorClass: 'bg-warning/15 text-warning',
        });
    }

    // 2. ექსპერტის რჩეული
    if (badges?.isCertified) {
        activeBadges.push({
            icon: StarFour,
            label: 'ექსპერტის რჩეული',
            colorClass: 'bg-primary/15 text-primary',
        });
    }

    // 3. უსაფრთხოება და ჰიგიენა
    if (badges?.isHygieneVerified) {
        activeBadges.push({
            icon: FirstAid,
            label: 'უსაფრთხოება და ჰიგიენა',
            colorClass: 'bg-success/15 text-success',
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
