'use client';

import React from 'react';
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
                <div className="h-2 w-2 rounded-full bg-success" />
                <p className="text-sm font-medium text-success">{t('portfolio.complete')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{percentage}% {t('portfolio.pct_complete')}</p>
                <p className="text-xs text-muted-foreground">{missingItems.length} {t('portfolio.remaining')}</p>
            </div>
            <Progress value={percentage} className="h-1.5" />
            {missingItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {missingItems.map((item) => (
                        <span
                            key={item}
                            className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
