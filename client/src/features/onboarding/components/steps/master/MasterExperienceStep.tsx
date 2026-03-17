'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function MasterExperienceStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    return (
        <WizardLayout
            title="How experienced are you?"
            subtitle="This helps clients know your level of expertise"
            onNext={goNext}
            onBack={goBack}
            nextDisabled={state.experienceYears === null || state.experienceYears < 0}
        >
            <div className="space-y-2">
                <Label className="text-sm">Years of experience</Label>
                <Input
                    type="number"
                    min={0}
                    max={50}
                    value={state.experienceYears ?? ''}
                    onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        dispatch({ type: 'SET_FIELD', payload: { experienceYears: val } });
                    }}
                    placeholder="e.g. 3"
                    className="rounded-xl"
                    autoFocus
                />
                <p className="text-xs text-muted-foreground">
                    Enter 0 if you're just starting out — everyone starts somewhere!
                </p>
            </div>
        </WizardLayout>
    );
}
