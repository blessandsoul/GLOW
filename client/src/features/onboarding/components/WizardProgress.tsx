'use client';

import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { StepConfig } from '../types/onboarding.types';

interface WizardProgressProps {
    steps: StepConfig[];
    currentStep: number;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps): React.ReactElement {
    return (
        <div className="flex items-center justify-center gap-1.5">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;

                return (
                    <div key={step.id} className="flex items-center gap-1.5">
                        <div
                            className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                                isCompleted && 'bg-primary text-primary-foreground',
                                isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                                !isCompleted && !isActive && 'bg-muted text-muted-foreground',
                            )}
                        >
                            {isCompleted ? <Check size={14} weight="bold" /> : index + 1}
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    'h-0.5 w-4 rounded-full transition-colors duration-300',
                                    index < currentStep ? 'bg-primary' : 'bg-muted',
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
