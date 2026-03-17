'use client';

import { useSpecialities } from '@/features/profile/hooks/useCatalog';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function MasterSpecializationStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { specialities, isLoading } = useSpecialities();
    const { t } = useLanguage();

    return (
        <WizardLayout
            title={t('onboarding.specialization_title')}
            subtitle={t('onboarding.specialization_subtitle')}
            onNext={goNext}
            onBack={goBack}
            nextDisabled={!state.niche}
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
                    {specialities.map((spec) => (
                        <button
                            key={spec.slug}
                            type="button"
                            onClick={() => dispatch({ type: 'SET_FIELD', payload: { niche: spec.slug } })}
                            className={cn(
                                'rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-150 cursor-pointer',
                                state.niche === spec.slug
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                            )}
                        >
                            {spec.label}
                        </button>
                    ))}
                </div>
            )}
        </WizardLayout>
    );
}
