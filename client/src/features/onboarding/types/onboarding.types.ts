import type { ServiceItem } from '@/features/profile/types/profile.types';

export type OnboardingRole = 'USER' | 'MASTER' | 'SALON';

export type VisitFrequency = 'biweekly' | 'monthly' | 'rarely' | 'first_time';

export interface OnboardingState {
    currentStep: number;
    role: OnboardingRole | null;
    phoneVerified: boolean;
    // Consents
    smsAppointments: boolean;
    smsPromotions: boolean;
    smsNews: boolean;
    // USER fields
    city: string;
    dateOfBirth: string;
    interestedCategories: string[];
    visitFrequency: VisitFrequency | null;
    // MASTER fields
    workAddress: string;
    latitude: number | null;
    longitude: number | null;
    niche: string;
    experienceYears: number | null;
    experienceMonths: number;
    services: ServiceItem[];
    portfolioItemIds: string[];
    // SALON fields
    salonName: string;
    serviceCategories: string[];
}

export type OnboardingAction =
    | { type: 'SET_ROLE'; payload: OnboardingRole }
    | { type: 'SET_PHONE_VERIFIED' }
    | { type: 'SET_FIELD'; payload: Partial<OnboardingState> }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'ADD_SERVICE'; payload: ServiceItem }
    | { type: 'REMOVE_SERVICE'; payload: number }
    | { type: 'ADD_PORTFOLIO_ITEM'; payload: string }
    | { type: 'REMOVE_PORTFOLIO_ITEM'; payload: string }
    | { type: 'GO_TO_STEP'; payload: number }
    | { type: 'RESET' };

export interface StepConfig {
    id: string;
    label: string;
    required: boolean;
}

export const INITIAL_STATE: OnboardingState = {
    currentStep: 0,
    role: null,
    phoneVerified: false,
    smsAppointments: true,
    smsPromotions: true,
    smsNews: true,
    city: '',
    dateOfBirth: '',
    interestedCategories: [],
    visitFrequency: null,
    workAddress: '',
    latitude: null,
    longitude: null,
    niche: '',
    experienceYears: null,
    experienceMonths: 0,
    services: [],
    portfolioItemIds: [],
    salonName: '',
    serviceCategories: [],
};
