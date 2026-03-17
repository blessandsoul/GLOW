'use client';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getCityOptions } from '@/lib/constants/cities';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function UserCityStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { t, language } = useLanguage();
    const cities = getCityOptions(language);

    return (
        <WizardLayout
            title={t('onboarding.city_title')}
            subtitle={t('onboarding.city_subtitle_user')}
            onNext={goNext}
            onBack={goBack}
            onSkip={goNext}
            showSkip={true}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
            skipLabel={t('onboarding.btn_skip')}
        >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cities.map((city) => (
                    <button
                        key={city.value}
                        type="button"
                        onClick={() => dispatch({ type: 'SET_FIELD', payload: { city: city.value } })}
                        className={cn(
                            'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer text-center',
                            state.city === city.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                        )}
                    >
                        {city.label}
                    </button>
                ))}
            </div>
        </WizardLayout>
    );
}
