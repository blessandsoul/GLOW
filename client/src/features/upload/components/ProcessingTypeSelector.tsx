'use client';

import { MagicWand, Eraser, Image, Crown } from '@phosphor-icons/react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import type { ProcessingType } from '../types/upload.types';
import { PROCESSING_COSTS, useUploadLabels } from '../types/upload.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';

const PROCESSING_TYPE_ICONS: Record<
    ProcessingType,
    React.ComponentType<{ size?: number; weight?: any; className?: string }>
> = {
    ENHANCE: MagicWand,
    RETOUCH: Eraser,
    BACKGROUND: Image,
    PRO_EDIT: Crown,
};

const PROCESSING_TYPES: ProcessingType[] = ['ENHANCE', 'RETOUCH', 'BACKGROUND', 'PRO_EDIT'];

function getCreditLabel(cost: number, t: any): string {
    if (cost === 1) return t('system.sys_buh6jq');
    return `${cost} ${t('ui.text_credits') || 'credits'}`;
}

interface ProcessingTypeSelectorProps {
    selected: ProcessingType;
    onSelect: (type: ProcessingType) => void;
    userCredits: number;
}

export function ProcessingTypeSelector({
    selected,
    onSelect,
    userCredits,
}: ProcessingTypeSelectorProps): React.ReactElement {
    const { t } = useLanguage();
    const { PROCESSING_TYPE_LABELS, PROCESSING_TYPE_DESCRIPTIONS } = useUploadLabels();

    return (
        <div className="grid grid-cols-2 gap-2">
            {PROCESSING_TYPES.map((type) => {
                const Icon = PROCESSING_TYPE_ICONS[type];
                const label = PROCESSING_TYPE_LABELS[type];
                const description = PROCESSING_TYPE_DESCRIPTIONS[type];
                const cost = PROCESSING_COSTS[type];
                const isSelected = selected === type;
                const canAfford = userCredits >= cost;

                return (
                    <button
                        key={type}
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onSelect(type)}
                        className={cn(
                            'group relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left',
                            'transition-all duration-200 ease-out',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            isSelected
                                ? 'border-primary/50 bg-primary/5 ring-2 ring-primary shadow-sm motion-safe:scale-[1.02]'
                                : 'border-border/50 bg-card hover:shadow-md hover:-translate-y-0.5',
                            !canAfford && 'cursor-not-allowed opacity-50 hover:shadow-none hover:translate-y-0',
                        )}
                    >
                        {/* Icon + cost badge row */}
                        <div className="flex w-full items-center justify-between">
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200',
                                    isSelected
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground',
                                )}
                            >
                                <Icon size={16} weight={isSelected ? 'fill' : 'regular'} />
                            </div>
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums',
                                    isSelected
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted/60 text-muted-foreground',
                                )}
                            >
                                {getCreditLabel(cost, t)}
                            </span>
                        </div>

                        {/* Label */}
                        <span
                            className={cn(
                                'text-xs font-semibold',
                                isSelected ? 'text-foreground' : 'text-foreground/80',
                            )}
                        >
                            {label}
                        </span>

                        {/* Description or "no credits" */}
                        {canAfford ? (
                            <span className="text-[10px] leading-snug text-muted-foreground">
                                {description}
                            </span>
                        ) : (
                            <Link
                                href={ROUTES.DASHBOARD_CREDITS}
                                className="text-[10px] font-medium text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {t('ui.text_2rjryw')}</Link>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
