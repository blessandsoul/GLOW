'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/features/auth/store/authSlice';
import { onboardingService } from '../services/onboarding.service';
import { clearOnboardingStorage } from './useOnboardingWizard';
import { getErrorMessage } from '@/lib/utils/error';
import type { OnboardingState } from '../types/onboarding.types';

function buildPayload(state: OnboardingState): Record<string, unknown> {
    const base = {
        smsAppointments: state.smsAppointments,
        smsPromotions: state.smsPromotions,
        smsNews: state.smsNews,
    };

    switch (state.role) {
        case 'USER':
            return {
                ...base,
                role: 'USER',
                ...(state.city && { city: state.city }),
                ...(state.dateOfBirth && { dateOfBirth: state.dateOfBirth }),
                ...(state.interestedCategories.length > 0 && { interestedCategories: state.interestedCategories }),
                ...(state.visitFrequency && { visitFrequency: state.visitFrequency }),
            };
        case 'MASTER':
            return {
                ...base,
                role: 'MASTER',
                city: state.city,
                workAddress: state.workAddress,
                latitude: state.latitude,
                longitude: state.longitude,
                niches: state.niches,
                experienceYears: state.experienceYears,
                experienceMonths: state.experienceMonths,
                services: state.services,
                portfolioItemIds: state.portfolioItemIds,
            };
        case 'SALON':
            return {
                ...base,
                role: 'SALON',
                salonName: state.salonName,
                city: state.city,
                workAddress: state.workAddress,
                latitude: state.latitude,
                longitude: state.longitude,
                serviceCategories: state.serviceCategories,
                portfolioItemIds: state.portfolioItemIds,
            };
        default:
            return base;
    }
}

export function useOnboardingSubmit() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = useCallback(async (state: OnboardingState): Promise<void> => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await onboardingService.complete(buildPayload(state));
            dispatch(setUser(res.user));
            clearOnboardingStorage();
            // Set cookie on client domain so Next.js middleware can read it
            // (the API server sets it on its own domain which may differ)
            document.cookie = 'onboardingCompleted=1; path=/; max-age=31536000; SameSite=Lax';
            router.push('/dashboard');
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, router]);

    return { submit, isSubmitting, error };
}
