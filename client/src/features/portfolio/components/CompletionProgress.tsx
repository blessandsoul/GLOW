'use client';

import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { CompletionCriteria } from '../types/builder.types';

interface CompletionProgressProps {
    percentage: number;
    missingItems: string[];
    criteria: CompletionCriteria;
}

export function CompletionProgress({ percentage, missingItems }: CompletionProgressProps): React.ReactElement {
    const { t } = useLanguage();

    if (percentage === 100) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
                <CheckCircle size={16} weight="fill" className="text-success" />
                <p className="text-sm font-medium text-success">{t('portfolio.complete')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums text-foreground">{percentage}%</span>
                    <span className="text-xs text-muted-foreground">{t('portfolio.pct_complete')}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {missingItems.length} {t('portfolio.remaining')}
                </span>
            </div>
            <Progress value={percentage} className="h-1" />
            {missingItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {missingItems.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                            <span className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                            {item}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
