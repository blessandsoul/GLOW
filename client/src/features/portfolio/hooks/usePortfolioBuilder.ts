'use client';

import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useMyPortfolio } from './usePortfolio';
import { useJobResults } from './useJobResults';
import { useCompletionProgress } from './useCompletionProgress';
import { useSectionObserver } from './useSectionObserver';
import { useAutoSaveProfile } from './useAutoSaveProfile';
import { DEFAULT_PROFILE } from '@/features/profile/types/profile.types';
import type { ProfileFormData } from '@/features/profile/types/profile.types';
import type { BuilderSection } from '../types/builder.types';

export function usePortfolioBuilder() {
    const user = useAppSelector((state) => state.auth.user);

    // Profile data
    const { profile, isLoading: isProfileLoading } = useProfile();

    // Portfolio items
    const { items, isLoading: isPortfolioLoading, addItem, updateItem, deleteItem } = useMyPortfolio();

    // Job results for image picker
    const { results: jobResults, isLoading: isResultsLoading } = useJobResults();

    // Build initial form data from profile
    const initialFormData = useMemo((): ProfileFormData => {
        if (!profile) return DEFAULT_PROFILE;
        return {
            city: profile.city ?? '',
            niche: profile.niche ?? '',
            bio: profile.bio ?? '',
            phone: profile.phone ?? '',
            whatsapp: profile.whatsapp ?? '',
            telegram: profile.telegram ?? '',
            instagram: profile.instagram ?? '',
            services: profile.services ?? [],
        };
    }, [profile]);

    // Auto-save profile
    const { form, updateField, saveStatus, saveNow } = useAutoSaveProfile(initialFormData);

    // Completion progress
    const progress = useCompletionProgress({ profile, items, user });

    // Section observer
    const { activeSection, scrollToSection } = useSectionObserver();

    // Images already in portfolio (by imageUrl)
    const portfolioImageUrls = useMemo(
        () => new Set(items.map((item) => item.imageUrl)),
        [items],
    );

    const isLoading = isProfileLoading || isPortfolioLoading;

    return {
        user,
        profile,
        form,
        updateField,
        saveStatus,
        saveNow,
        items,
        jobResults,
        portfolioImageUrls,
        addItem,
        updateItem,
        deleteItem,
        progress,
        activeSection,
        scrollToSection,
        isLoading,
        isResultsLoading,
    };
}

export type PortfolioBuilderState = ReturnType<typeof usePortfolioBuilder>;
