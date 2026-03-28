'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, UsersThree, SignOut, Sparkle } from '@phosphor-icons/react';
import { PersonalInfoSection } from '@/features/profile/components/ProfileSetup';
import { AccountStatus } from '@/features/profile/components/AccountStatus';
import { VerificationSection } from '@/features/verification/components/VerificationSection';
import { GlowStarSection } from '@/features/verification/components/GlowStarSection';
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard';
import { ChangeUsername } from '@/features/profile/components/ChangeUsername';
import { ChangePassword } from '@/features/profile/components/ChangePassword';
import { DeleteAccount } from '@/features/profile/components/DeleteAccount';
import { ROUTES } from '@/lib/constants/routes';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ProfilePage(): React.ReactElement {
    const { t } = useLanguage();
    const { logout, user } = useAuth();
    const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

    return (
        <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
            {/* Welcome hero */}
            <ProfileHeroCard />

            {/* Account status — role, email, member since */}
            <AccountStatus />

            {/* Personal info — avatar, name */}
            <PersonalInfoSection />

            {/* Username */}
            <ChangeUsername />

            {/* Security */}
            <ChangePassword />

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

            {/* Verification detail section (masters only, anchored) */}
            {isMaster && (
                <div id="section-verification">
                    <VerificationSection />
                </div>
            )}

            {/* Glow Star section (masters only, anchored) */}
            {isMaster && (
                <div id="section-glow-star">
                    <GlowStarSection />
                </div>
            )}

            {/* Sign out */}
            <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card p-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
            >
                <SignOut size={16} weight="bold" />
                {t('auth.logout')}
            </button>

            {/* Danger zone */}
            <DeleteAccount />
        </div>
    );
}
