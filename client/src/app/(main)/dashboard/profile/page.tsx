'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, UsersThree, SignOut } from '@phosphor-icons/react';
import { PersonalInfoSection } from '@/features/profile/components/ProfileSetup';
import { AccountStatus } from '@/features/profile/components/AccountStatus';
import { ChangePassword } from '@/features/profile/components/ChangePassword';
import { DeleteAccount } from '@/features/profile/components/DeleteAccount';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ProfilePage(): React.ReactElement {
    const { t } = useLanguage();
    const { logout } = useAuth();

    return (
        <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('ui.profile_title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('ui.profile_desc')}
                </p>
            </div>

            {/* Referrals CTA */}
            <Link
                href={ROUTES.DASHBOARD_REFERRALS}
                className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/10"
            >
                <div className="rounded-full bg-primary/10 p-3">
                    <UsersThree size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t('nav.referrals')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('ui.profile_referrals_desc')}
                    </p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-primary" />
            </Link>

            {/* 1. Account status — role, email, member since */}
            <AccountStatus />

            {/* 2. Personal info — avatar, name */}
            <PersonalInfoSection />

            {/* 3. Portfolio CTA */}
            <Link
                href={ROUTES.DASHBOARD_PORTFOLIO}
                className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/10"
            >
                <div className="rounded-full bg-primary/10 p-3">
                    <Briefcase size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t('ui.profile_portfolio_cta')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('ui.profile_portfolio_cta_desc')}
                    </p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-primary" />
            </Link>

            {/* 4. Security */}
            <ChangePassword />

            {/* Sign out */}
            <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card p-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
            >
                <SignOut size={16} weight="bold" />
                {t('auth.logout')}
            </button>

            {/* 5. Danger zone */}
            <DeleteAccount />
        </div>
    );
}
