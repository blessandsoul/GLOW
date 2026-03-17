'use client';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';
import type { VisitFrequency } from '../../../types/onboarding.types';

export function UserFrequencyStep({ state, dispatch, goBack, onSubmit, isSubmitting, submitError }: StepProps): React.ReactElement {
    const { t } = useLanguage();

    const options: { id: VisitFrequency; label: string; description: string }[] = [
        { id: 'biweekly', label: t('onboarding.frequency_biweekly'), description: t('onboarding.frequency_biweekly_desc') },
        { id: 'monthly', label: t('onboarding.frequency_monthly'), description: t('onboarding.frequency_monthly_desc') },
        { id: 'rarely', label: t('onboarding.frequency_rarely'), description: t('onboarding.frequency_rarely_desc') },
        { id: 'first_time', label: t('onboarding.frequency_first_time'), description: t('onboarding.frequency_first_time_desc') },
    ];

    return (
        <WizardLayout
            title={t('onboarding.frequency_title')}
            subtitle={t('onboarding.frequency_subtitle')}
            onNext={onSubmit}
            onBack={goBack}
            nextLabel={t('onboarding.btn_get_started')}
            backLabel={t('onboarding.btn_back')}
            skipLabel={t('onboarding.btn_skip')}
            nextLoading={isSubmitting}
            onSkip={onSubmit}
            showSkip={true}
        >
            <div className="grid gap-2">
                {options.map(({ id, label, description }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => dispatch({ type: 'SET_FIELD', payload: { visitFrequency: id } })}
                        className={cn(
                            'flex flex-col rounded-xl border px-4 py-3 text-left transition-all duration-150 cursor-pointer',
                            state.visitFrequency === id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                                : 'border-border/60 bg-card hover:border-primary/40',
                        )}
                    >
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                    </button>
                ))}
            </div>
            {submitError && (
                <p className="text-center text-xs text-destructive">{submitError}</p>
            )}
        </WizardLayout>
    );
}
