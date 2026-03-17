'use client';

import { User, Scissors, Buildings } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { WizardLayout } from '../WizardLayout';
import type { StepProps } from '../OnboardingWizard';
import type { OnboardingRole } from '../../types/onboarding.types';

export function RoleSelectionStep({ state, dispatch, goNext }: StepProps): React.ReactElement {
    const { t } = useLanguage();

    const roles: { id: OnboardingRole; label: string; description: string; icon: React.ElementType }[] = [
        {
            id: 'USER',
            label: t('onboarding.role_client'),
            description: t('onboarding.role_client_desc'),
            icon: User,
        },
        {
            id: 'MASTER',
            label: t('onboarding.role_master'),
            description: t('onboarding.role_master_desc'),
            icon: Scissors,
        },
        {
            id: 'SALON',
            label: t('onboarding.role_salon'),
            description: t('onboarding.role_salon_desc'),
            icon: Buildings,
        },
    ];

    const handleSelect = (role: OnboardingRole): void => {
        dispatch({ type: 'SET_ROLE', payload: role });
    };

    return (
        <WizardLayout
            title={t('onboarding.role_title')}
            subtitle={t('onboarding.role_subtitle')}
            onNext={goNext}
            nextLabel={t('onboarding.btn_continue')}
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
