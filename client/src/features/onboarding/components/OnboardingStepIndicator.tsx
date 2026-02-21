import { Check } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

interface OnboardingStepIndicatorProps {
    currentStep: 1 | 2 | 3;
}

const STEPS = [
    { number: 1 as const, label: 'system.sys_ga2li7' },
    { number: 2 as const, label: 'system.sys_m7x59z' },
    { number: 3 as const, label: 'system.sys_2lexch' },
];

export function OnboardingStepIndicator({ currentStep }: OnboardingStepIndicatorProps): React.ReactElement {
    return (
        <div className="flex items-center justify-center gap-0">
            {STEPS.map((step, index) => {
                const isCompleted = step.number < currentStep;
                const isActive = step.number === currentStep;
                const isFuture = step.number > currentStep;

                return (
                    <div key={step.number} className="flex items-center">
                        {/* Step item */}
                        <div className="flex flex-col items-center gap-2">
                            {/* Dot / check */}
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
                                    isCompleted && 'bg-primary',
                                    isActive && 'bg-primary ring-4 ring-primary/20',
                                    isFuture && 'border-2 border-muted-foreground/30 bg-transparent',
                                )}
                            >
                                {isCompleted ? (
                                    <Check size={14} weight="bold" className="text-primary-foreground" />
                                ) : isActive ? (
                                    <span className="text-xs font-bold text-primary-foreground">{step.number}</span>
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground/50">{step.number}</span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    'whitespace-nowrap text-xs transition-colors duration-200',
                                    isActive && 'font-medium text-foreground',
                                    isCompleted && 'text-muted-foreground',
                                    isFuture && 'text-muted-foreground',
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector line (not after last step) */}
                        {index < STEPS.length - 1 && (
                            <div
                                className={cn(
                                    'mb-5 h-px w-12 transition-colors duration-200 sm:w-16',
                                    step.number < currentStep ? 'bg-primary' : 'bg-border',
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
