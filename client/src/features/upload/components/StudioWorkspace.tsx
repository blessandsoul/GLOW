'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins, Sparkle } from '@phosphor-icons/react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { UploadSection } from './UploadSection';

interface StudioWorkspaceProps {
    children?: React.ReactNode;
}

export function StudioWorkspace({ children }: StudioWorkspaceProps): React.ReactElement {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkle size={18} weight="fill" className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            {t('nav.create')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('create.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Credits pill */}
                {mounted && user !== null && user !== undefined && (
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
                )}
            </div>

            {/* Workspace card */}
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                {mounted ? (
                    children ?? <UploadSection />
                ) : (
                    <div className="flex min-h-130 w-full items-center justify-center">
                        <Sparkle size={28} weight="fill" className="animate-pulse text-primary/30" />
                    </div>
                )}
            </div>
        </div>
    );
}
