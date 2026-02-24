'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { MasterProfile } from '@/features/profile/types/profile.types';
import type { PortfolioItem } from '../types/portfolio.types';
import type { CompletionCriteria } from '../types/builder.types';
import type { IUser } from '@/features/auth/types/auth.types';

interface CompletionInput {
    profile: MasterProfile | null | undefined;
    items: PortfolioItem[];
    user: IUser | null;
}

interface CompletionResult {
    percentage: number;
    criteria: CompletionCriteria;
    missingItems: string[];
}

export function useCompletionProgress({ profile, items, user }: CompletionInput): CompletionResult {
    const { t } = useLanguage();

    return useMemo(() => {
        const publishedCount = items.filter((i) => i.isPublished).length;

        const criteria: CompletionCriteria = {
            hasName: Boolean(user?.firstName && user.firstName.trim()),
            hasCity: Boolean(profile?.city && profile.city.trim()),
            hasNiche: Boolean(profile?.niche && profile.niche.trim()),
            hasBio: Boolean(profile?.bio && profile.bio.trim()),
            hasService: Boolean(profile?.services && profile.services.length > 0),
            hasMinImages: publishedCount >= 3,
        };

        const total = Object.values(criteria).length;
        const completed = Object.values(criteria).filter(Boolean).length;
        const percentage = Math.round((completed / total) * 100);

        const missing: string[] = [];
        if (!criteria.hasName) missing.push(t('portfolio.missing_name'));
        if (!criteria.hasCity) missing.push(t('portfolio.missing_city'));
        if (!criteria.hasNiche) missing.push(t('portfolio.missing_niche'));
        if (!criteria.hasBio) missing.push(t('portfolio.missing_bio'));
        if (!criteria.hasService) missing.push(t('portfolio.missing_service'));
        if (!criteria.hasMinImages) missing.push(`${t('portfolio.missing_photos_prefix')} ${3 - publishedCount} ${t('portfolio.missing_photos_suffix')}`);

        return { percentage, criteria, missingItems: missing };
    }, [profile, items, user, t]);
}
