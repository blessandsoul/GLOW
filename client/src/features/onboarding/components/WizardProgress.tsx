'use client';

import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { StepConfig } from '../types/onboarding.types';

interface WizardProgressProps {
    steps: StepConfig[];
    currentStep: number;
    onGoToStep?: (index: number) => void;
}

export function WizardProgress({ steps, currentStep, onGoToStep }: WizardProgressProps): React.ReactElement {
    return (
        <div className="flex flex-col gap-1 w-full">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const canNavigate = isCompleted && onGoToStep;

                return (
                    <button
                        key={step.id}
                        type="button"
                        disabled={!canNavigate}
                        onClick={() => canNavigate && onGoToStep(index)}
                        className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
                            isActive && 'bg-white/10',
                            canNavigate && 'cursor-pointer hover:bg-white/10',
                            !canNavigate && !isActive && 'cursor-default',
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300',
                                isCompleted && 'bg-white text-primary',
                                isActive && 'bg-white text-primary ring-4 ring-white/20',
                                !isCompleted && !isActive && 'bg-white/15 text-white/50',
                            )}
                        >
                            {isCompleted ? <Check size={12} weight="bold" /> : index + 1}
                        </div>
                        <span
                            className={cn(
                                'text-sm font-medium transition-colors duration-200',
                                isActive && 'text-white',
                                isCompleted && 'text-white/70',
                                !isCompleted && !isActive && 'text-white/40',
                            )}
                        >
                            {step.label}
                        </span>
                        {isActive && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
