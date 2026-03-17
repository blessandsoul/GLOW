'use client';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

const YEAR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

export function MasterExperienceStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <WizardLayout
            title={t('onboarding.experience_title')}
            subtitle={t('onboarding.experience_subtitle')}
            onNext={goNext}
            onBack={goBack}
            nextDisabled={state.experienceYears === null || state.experienceYears < 0}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
        >
            <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">{t('onboarding.experience_years')}</p>
                <div className="flex flex-wrap gap-2">
                    {YEAR_OPTIONS.map((year) => (
                        <button
                            key={year}
                            type="button"
                            onClick={() => dispatch({ type: 'SET_FIELD', payload: { experienceYears: year } })}
                            className={cn(
                                'rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer',
                                state.experienceYears === year
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                            )}
                        >
                            {year === 20 ? '20+' : year}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">{t('onboarding.experience_hint')}</p>
            </div>
        </WizardLayout>
    );
}
