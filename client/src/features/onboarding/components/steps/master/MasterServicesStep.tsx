'use client';

import { useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AddServicePanel } from '@/features/profile/components/AddServicePanel';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';
import type { ServiceItem } from '@/features/profile/types/profile.types';

export function MasterServicesStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const [showAdd, setShowAdd] = useState(state.services.length === 0);
    const { t } = useLanguage();

    const handleAdd = (service: ServiceItem): void => {
        dispatch({ type: 'ADD_SERVICE', payload: service });
        setShowAdd(false);
    };

    return (
        <WizardLayout
            title={t('onboarding.services_title')}
            subtitle={t('onboarding.services_subtitle')}
            onNext={goNext}
            onBack={goBack}
            nextDisabled={state.services.length === 0}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
        >
            <div className="space-y-4">
                {state.services.length > 0 && (
                    <div className="space-y-2">
                        {state.services.map((service, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3"
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {service.startingFrom && 'from '}
                                        {service.price} ₾ / {service.priceType === 'hourly' ? 'hr' : 'fixed'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: 'REMOVE_SERVICE', payload: index })}
                                    className="text-muted-foreground transition-colors hover:text-destructive"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {showAdd ? (
                    <AddServicePanel
                        onAdd={handleAdd}
                        onCancel={() => state.services.length > 0 && setShowAdd(false)}
                    />
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdd(true)}
                        className="gap-1.5"
                    >
                        <Plus size={14} />
                        {t('onboarding.services_add_another')}
                    </Button>
                )}
            </div>
        </WizardLayout>
    );
}
