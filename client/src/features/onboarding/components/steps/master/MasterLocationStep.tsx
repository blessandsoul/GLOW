'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPicker } from '@/features/profile/components/LocationPicker';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function MasterLocationStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const canContinue = state.city.trim().length > 0 && state.workAddress.trim().length > 0;

    return (
        <WizardLayout
            title="Where do you work?"
            subtitle="Clients will find you based on your location"
            onNext={goNext}
            onBack={goBack}
            nextDisabled={!canContinue}
        >
            <div className="space-y-4">
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
                <div className="space-y-2">
                    <Label className="text-sm">Work address</Label>
                    <Input
                        value={state.workAddress}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { workAddress: e.target.value } })}
                        placeholder="e.g. Rustaveli Ave 42"
                        className="rounded-xl"
                    />
                </div>
                <LocationPicker
                    latitude={state.latitude}
                    longitude={state.longitude}
                    onChange={(lat, lng) => dispatch({ type: 'SET_FIELD', payload: { latitude: lat, longitude: lng } })}
                />
            </div>
        </WizardLayout>
    );
}
