'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, UsersThree, SignOut, Sparkle } from '@phosphor-icons/react';
import { PersonalInfoSection } from '@/features/profile/components/ProfileSetup';
import { AccountStatus } from '@/features/profile/components/AccountStatus';
import { VerificationSection } from '@/features/verification/components/VerificationSection';
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

            {/* Portfolio CTA — primary action, always visible */}
            <Link
                href={ROUTES.DASHBOARD_PORTFOLIO}
                className="group flex items-center gap-4 rounded-2xl border-2 border-primary/30 bg-primary/10 p-6 shadow-sm shadow-primary/10 transition-all duration-200 hover:border-primary/50 hover:bg-primary/15 hover:shadow-md hover:shadow-primary/15 hover:-translate-y-0.5 active:scale-[0.99]"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 transition-colors duration-200 group-hover:bg-primary/30">
                    <Briefcase size={24} weight="fill" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground">{t('ui.profile_portfolio_cta')}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {t('ui.profile_portfolio_cta_desc')}
                    </p>
                </div>
                <ArrowRight size={20} weight="bold" className="shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

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

            {/* Onboarding CTA */}
            <Link
                href={ROUTES.ONBOARDING}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
            >
                <div className="rounded-full bg-primary/10 p-3">
                    <Sparkle size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t('onboarding.setup_wizard')}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('onboarding.setup_wizard_desc')}
                    </p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-muted-foreground" />
            </Link>

            {/* 1. Account status — role, email, member since */}
            <AccountStatus />

            {/* 2. Verification status (masters only) */}
            <VerificationSection />

            {/* 3. Personal info — avatar, name */}
            <PersonalInfoSection />

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
