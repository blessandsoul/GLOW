'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins, Sparkle } from '@phosphor-icons/react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { IS_LAUNCH_MODE } from '@/lib/launch-mode';
import { useDailyUsage } from '@/features/jobs/hooks/useDailyUsage';
import { UploadSection } from './UploadSection';

interface StudioWorkspaceProps {
    children?: React.ReactNode;
}

export function StudioWorkspace({ children }: StudioWorkspaceProps): React.ReactElement {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { remaining: dailyRemaining, data: dailyData } = useDailyUsage();
    const dailyLimit = dailyData?.limit ?? 5;
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="container mx-auto max-w-6xl px-3 py-4 md:px-6 md:py-8 lg:px-8">
            {/* Page header */}
            <div className="mb-3 md:mb-6 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkle size={18} weight="fill" className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">
                            {t('nav.create')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('create.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Credits pill */}
                {mounted && user !== null && user !== undefined && (
                    IS_LAUNCH_MODE ? (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums',
                                dailyRemaining > 2
                                    ? 'bg-success/15 text-success'
                                    : dailyRemaining > 0
                                        ? 'bg-warning/15 text-warning'
                                        : 'bg-destructive/15 text-destructive',
                            )}
                        >
                            {dailyRemaining}/{dailyLimit} {t('ui.daily_remaining')}
                        </span>
                    ) : (
                        <Link
                            href={ROUTES.DASHBOARD_CREDITS}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition-opacity duration-150 hover:opacity-80',
                                (user.credits ?? 0) >= 50
                                    ? 'bg-warning/15 text-warning'
                                    : (user.credits ?? 0) >= 10
                                        ? 'bg-success/15 text-success'
                                        : 'bg-destructive/15 text-destructive',
                            )}
                        >
                            <Coins size={13} weight="fill" />
                            {user.credits ?? 0} {t('ui.text_credits')}
                        </Link>
                    )
                )}
            </div>

            {/* Workspace card */}
            <div className="overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-card shadow-sm">
                {mounted ? (
                    children ?? <UploadSection />
                ) : (
                    <div className="flex w-full items-center justify-center py-16">
                        <Sparkle size={28} weight="fill" className="animate-pulse text-primary/30" />
                    </div>
                )}
            </div>
        </div>
    );
}
