'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function UserDobStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    return (
        <WizardLayout
            title="When is your birthday?"
            subtitle="We'll personalize recommendations for you"
            onNext={goNext}
            onBack={goBack}
            onSkip={goNext}
            showSkip={true}
        >
            <div className="space-y-2">
                <Label className="text-sm">Date of birth</Label>
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
