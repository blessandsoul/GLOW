'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function UserDobStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <WizardLayout
            title={t('onboarding.dob_title')}
            subtitle={t('onboarding.dob_subtitle')}
            onNext={goNext}
            onBack={goBack}
            onSkip={goNext}
            showSkip={true}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
            skipLabel={t('onboarding.btn_skip')}
        >
            <div className="space-y-2">
                <Label className="text-sm">{t('onboarding.dob_label')}</Label>
                <Input
                    type="date"
                    value={state.dateOfBirth}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { dateOfBirth: e.target.value } })}
                    className="rounded-xl"
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>
        </WizardLayout>
    );
}
