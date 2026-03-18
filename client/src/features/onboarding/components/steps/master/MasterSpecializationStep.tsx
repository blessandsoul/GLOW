'use client';

import { useCallback } from 'react';
import { Check } from 'lucide-react';
import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

const MAX_NICHES = 3;

export function MasterSpecializationStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { specialities, isLoading } = useSpecialities();
    const { t } = useLanguage();

    const handleToggle = useCallback((slug: string): void => {
        const current = state.niches;
        const isSelected = current.includes(slug);

        if (isSelected) {
            dispatch({ type: 'SET_FIELD', payload: { niches: current.filter((s) => s !== slug) } });
        } else if (current.length < MAX_NICHES) {
            dispatch({ type: 'SET_FIELD', payload: { niches: [...current, slug] } });
        }
    }, [state.niches, dispatch]);

    const isMaxReached = state.niches.length >= MAX_NICHES;

    return (
        <WizardLayout
            title={t('onboarding.specialization_title')}
            subtitle={t('onboarding.specialization_subtitle')}
            onNext={goNext}
            onBack={goBack}
            nextDisabled={state.niches.length === 0}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
        >
            {isLoading ? (
                <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {specialities.map((spec) => {
                        const isSelected = state.niches.includes(spec.slug);
                        const isDisabled = !isSelected && isMaxReached;

                        return (
                            <button
                                key={spec.slug}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => handleToggle(spec.slug)}
                                className={cn(
                                    'relative rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-150',
                                    isSelected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : isDisabled
                                            ? 'cursor-not-allowed border-border/30 bg-muted/50 text-muted-foreground/50'
                                            : 'cursor-pointer border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                                )}
                            >
                                {spec.label}
                                {isSelected && (
                                    <Check size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </WizardLayout>
    );
}
