import React from 'react';
import { ProfileSetup, PersonalInfoSection } from '@/features/profile/components/ProfileSetup';
import { AccountStatus } from '@/features/profile/components/AccountStatus';
import { ChangePassword } from '@/features/profile/components/ChangePassword';
import { DeleteAccount } from '@/features/profile/components/DeleteAccount';
import { PublicProfileCard } from '@/features/profile/components/PublicProfileCard';
import { PortfolioPreview } from '@/features/profile/components/PortfolioPreview';

export default function ProfilePage(): React.ReactElement {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your personal info, portfolio, and account settings.
                </p>
            </div>

            {/* 1. Account status — role, email, member since */}
            <AccountStatus />

            {/* 2. Public profile link + portfolio mini-preview */}
            <PublicProfileCard />
            <PortfolioPreview />

            {/* 3. Personal info — avatar, name */}
            <PersonalInfoSection />

            {/* 4. Master profile — city, niche, bio, contacts, services */}
            <ProfileSetup />

            {/* 5. Security */}
            <ChangePassword />

            {/* 6. Danger zone */}
            <DeleteAccount />
        </div>
    );
}
