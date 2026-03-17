'use client';

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { OnboardingState, OnboardingAction, OnboardingRole, StepConfig } from '../types/onboarding.types';
import { INITIAL_STATE } from '../types/onboarding.types';

const STORAGE_KEY = 'glow_onboarding_draft';

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
    switch (action.type) {
        case 'SET_ROLE':
            return { ...state, role: action.payload, currentStep: state.currentStep };
        case 'SET_PHONE_VERIFIED':
            return { ...state, phoneVerified: true };
        case 'SET_FIELD':
            return { ...state, ...action.payload };
        case 'NEXT_STEP':
            return { ...state, currentStep: state.currentStep + 1 };
        case 'PREV_STEP':
            return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
        case 'ADD_SERVICE':
            return { ...state, services: [...state.services, action.payload] };
        case 'REMOVE_SERVICE':
            return { ...state, services: state.services.filter((_, i) => i !== action.payload) };
        case 'ADD_PORTFOLIO_ITEM':
            return { ...state, portfolioItemIds: [...state.portfolioItemIds, action.payload] };
        case 'REMOVE_PORTFOLIO_ITEM':
            return { ...state, portfolioItemIds: state.portfolioItemIds.filter((id) => id !== action.payload) };
        case 'RESET':
            return INITIAL_STATE;
        default:
            return state;
    }
}

function getSteps(role: OnboardingRole | null): StepConfig[] {
    const base: StepConfig[] = [
        { id: 'role', label: 'Role', required: true },
        { id: 'phone', label: 'Phone', required: true },
    ];

    if (!role) return base;

    if (role === 'USER') {
        return [
            ...base,
            { id: 'user-city', label: 'City', required: false },
            { id: 'user-dob', label: 'Birthday', required: false },
            { id: 'user-categories', label: 'Interests', required: false },
            { id: 'user-frequency', label: 'Frequency', required: false },
        ];
    }

    if (role === 'MASTER') {
        return [
            ...base,
            { id: 'master-location', label: 'Location', required: true },
            { id: 'master-specialization', label: 'Specialization', required: true },
            { id: 'master-experience', label: 'Experience', required: true },
            { id: 'master-services', label: 'Services', required: true },
            { id: 'master-portfolio', label: 'Portfolio', required: true },
        ];
    }

    // SALON
    return [
        ...base,
        { id: 'salon-info', label: 'Salon Info', required: true },
        { id: 'salon-categories', label: 'Services', required: true },
        { id: 'salon-photos', label: 'Photos', required: true },
    ];
}

function loadFromStorage(): OnboardingState | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as OnboardingState;
    } catch {
        return null;
    }
}

function saveToStorage(state: OnboardingState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage full or unavailable
    }
}

export function clearOnboardingStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore
    }
}

export function useOnboardingWizard() {
    const saved = typeof window !== 'undefined' ? loadFromStorage() : null;
    // Clamp currentStep to valid range on restore
    const initial = saved ? { ...saved, currentStep: Math.min(saved.currentStep, getSteps(saved.role).length - 1) } : INITIAL_STATE;
    const [state, dispatch] = useReducer(onboardingReducer, initial);

    useEffect(() => {
        saveToStorage(state);
    }, [state]);

    const steps = useMemo(() => getSteps(state.role), [state.role]);
    const currentStepConfig = steps[state.currentStep] ?? null;
    const isLastStep = state.currentStep === steps.length - 1;
    const isFirstStep = state.currentStep === 0;

    const goNext = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
    const goBack = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);

    return {
        state,
        dispatch,
        steps,
        currentStepConfig,
        isLastStep,
        isFirstStep,
        goNext,
        goBack,
    };
}
