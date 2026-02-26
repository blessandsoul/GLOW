'use client';

import { Clock } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface DailyLimitReachedProps {
    countdown: string;
}

export function DailyLimitReached({ countdown }: DailyLimitReachedProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
                <Clock size={32} weight="fill" className="text-warning" />
            </div>
            <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-foreground">
                    {t('ui.daily_limit_title')}
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                    {t('ui.daily_limit_desc')}
                </p>
            </div>
            {countdown && (
                <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2">
                    <Clock size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium tabular-nums text-foreground">
                        {t('ui.daily_limit_countdown')} {countdown}
                    </span>
                </div>
            )}
        </div>
    );
}
