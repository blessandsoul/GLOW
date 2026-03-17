'use client';

import { User, Scissors, Buildings } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WizardLayout } from '../WizardLayout';
import type { StepProps } from '../OnboardingWizard';
import type { OnboardingRole } from '../../types/onboarding.types';

const roles: { id: OnboardingRole; label: string; description: string; icon: React.ElementType }[] = [
    {
        id: 'USER',
        label: 'Client',
        description: 'Find and book beauty professionals near you',
        icon: User,
    },
    {
        id: 'MASTER',
        label: 'Master',
        description: 'Showcase your work and grow your client base',
        icon: Scissors,
    },
    {
        id: 'SALON',
        label: 'Salon',
        description: 'Manage your salon and team of professionals',
        icon: Buildings,
    },
];

export function RoleSelectionStep({ state, dispatch, goNext }: StepProps): React.ReactElement {
    const handleSelect = (role: OnboardingRole): void => {
        dispatch({ type: 'SET_ROLE', payload: role });
    };

    return (
        <WizardLayout
            title="Welcome to Glow.GE"
            subtitle="Tell us who you are so we can personalize your experience"
            onNext={goNext}
            nextDisabled={!state.role}
            showBack={false}
        >
            <div className="grid gap-3">
                {roles.map(({ id, label, description, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => handleSelect(id)}
                        className={cn(
                            'flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer',
                            state.role === id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
                                : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-sm',
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                                state.role === id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            <Icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </WizardLayout>
    );
}
