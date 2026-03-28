'use client';

import React from 'react';
import Image from 'next/image';
import { Warning } from '@phosphor-icons/react';
import { useAppSelector } from '@/store/hooks';
import { usePortfolioPreview } from '@/features/profile/hooks/usePortfolioPreview';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface ProfileHeroCardProps {
    hasPendingBadges: boolean;
}

export function ProfileHeroCard({ hasPendingBadges }: ProfileHeroCardProps): React.ReactElement | null {
    const user = useAppSelector((s) => s.auth.user);
    const { publishedCount } = usePortfolioPreview();
    const { t } = useLanguage();

    if (!user) return null;

    const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

    return (
        <div className="rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={user.firstName}
                            width={72}
                            height={72}
                            className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-primary/20"
                        />
                    ) : (
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/20">
                            <span className="text-xl font-bold text-primary">{initials}</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-foreground">
                        {t('ui.profile_welcome').replace('{name}', user.firstName)}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {user.email}
                    </p>
                    {(user.role === 'MASTER' || user.role === 'ADMIN') && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('ui.profile_portfolio_stat').replace('{count}', String(publishedCount))}
                        </p>
                    )}
                </div>
            </div>

            {/* Badge hint */}
            {hasPendingBadges && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-warning/10 px-4 py-2.5">
                    <Warning size={16} weight="fill" className="shrink-0 text-warning" />
                    <p className="text-sm text-warning font-medium">
                        {t('ui.profile_badges_hint')}
                    </p>
                </div>
            )}
        </div>
    );
}
