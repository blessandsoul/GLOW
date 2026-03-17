'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function UserCityStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    return (
        <WizardLayout
            title="Where do you live?"
            subtitle="We'll show you beauty professionals nearby"
            onNext={goNext}
            onBack={goBack}
            onSkip={goNext}
            showSkip={true}
        >
            <div className="space-y-2">
                <Label className="text-sm">City</Label>
                <Input
                    value={state.city}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { city: e.target.value } })}
                    placeholder="e.g. Tbilisi"
                    className="rounded-xl"
                    autoFocus
                />
            </div>
        </WizardLayout>
    );
}
