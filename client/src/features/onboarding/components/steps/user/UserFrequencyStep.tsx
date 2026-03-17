'use client';

import { cn } from '@/lib/utils';
import { WizardLayout } from '../../WizardLayout';
import { useOnboardingSubmit } from '../../../hooks/useOnboardingSubmit';
import type { StepProps } from '../../OnboardingWizard';
import type { VisitFrequency } from '../../../types/onboarding.types';

const options: { id: VisitFrequency; label: string; description: string }[] = [
    { id: 'biweekly', label: 'Every 2 weeks', description: 'Regular maintenance' },
    { id: 'monthly', label: 'Once a month', description: 'Standard schedule' },
    { id: 'rarely', label: 'A few times a year', description: 'Occasional visits' },
    { id: 'first_time', label: 'First time', description: 'Never been before' },
];

export function UserFrequencyStep({ state, dispatch, goBack, onSubmit, isSubmitting, submitError }: StepProps): React.ReactElement {
    return (
        <WizardLayout
            title="How often do you visit?"
            subtitle="This helps us suggest the right schedule"
            onNext={onSubmit}
            onBack={goBack}
            nextLabel="Get started"
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
