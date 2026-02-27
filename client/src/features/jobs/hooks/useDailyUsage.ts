'use client';

import { useState, useEffect, useCallback } from 'react';
import { dailyUsageService } from '../services/dailyUsage.service';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { DailyUsage } from '../services/dailyUsage.service';

interface UseDailyUsageReturn {
    data: DailyUsage | null;
    isLoading: boolean;
    remaining: number;
    isLimitReached: boolean;
    countdown: string;
    refetch: () => Promise<void>;
}

export function useDailyUsage(): UseDailyUsageReturn {
    const { t } = useLanguage();
    const [data, setData] = useState<DailyUsage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [countdown, setCountdown] = useState('');

    const fetchUsage = useCallback(async (): Promise<void> => {
        if (!IS_LAUNCH_MODE) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await dailyUsageService.getDailyUsage();
            setData(res);
        } catch {
            // Silently fail — usage display is non-critical
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    // Countdown timer
    useEffect(() => {
        if (!data?.resetsAt) return;

        const updateCountdown = (): void => {
            const now = Date.now();
            const resetTime = new Date(data.resetsAt).getTime();
            const diff = resetTime - now;

            if (diff <= 0) {
                setCountdown('');
                fetchUsage(); // Refresh when timer expires
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const h = t('ui.daily_limit_hours');
            const m = t('ui.daily_limit_minutes');

            if (hours > 0) {
                setCountdown(`${hours}${h} ${minutes}${m}`);
            } else {
                setCountdown(`${minutes}${m}`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [data?.resetsAt, fetchUsage, t]);

    const remaining = data ? data.limit - data.used : 0;
    const isLimitReached = data ? data.used >= data.limit : false;

    return {
        data,
        isLoading,
        remaining,
        isLimitReached,
        countdown,
        refetch: fetchUsage,
    };
}
