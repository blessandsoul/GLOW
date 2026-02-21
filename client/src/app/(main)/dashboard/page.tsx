'use client';

import { Diamond, ClockCounterClockwise } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { JobHistoryList } from '@/features/jobs/components/JobHistoryList';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export default function DashboardPage(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">{t('nav.dashboard')}</h1>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/credits">
                        <Diamond size={16} className="mr-2 text-primary" />
                        {t('dashboard.credits_btn')}
                    </Link>
                </Button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ClockCounterClockwise size={16} />
                    <h2 className="text-sm font-medium">{t('dashboard.history_title')}</h2>
                </div>
                <JobHistoryList />
            </div>
        </div>
    );
}
