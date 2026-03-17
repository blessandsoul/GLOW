'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getCityOptions } from '@/lib/constants/cities';
import { cn } from '@/lib/utils';
import { LocationPicker } from '@/features/profile/components/LocationPicker';
import { WizardLayout } from '../../WizardLayout';
import type { StepProps } from '../../OnboardingWizard';

export function MasterLocationStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { t, language } = useLanguage();
    const cities = getCityOptions(language);
    const canContinue = state.city.trim().length > 0 && state.workAddress.trim().length > 0;

    return (
        <WizardLayout
            title={t('onboarding.location_title')}
            subtitle={t('onboarding.city_subtitle_master')}
            onNext={goNext}
            onBack={goBack}
            nextDisabled={!canContinue}
            nextLabel={t('onboarding.btn_continue')}
            backLabel={t('onboarding.btn_back')}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm">{t('onboarding.city_label')}</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {cities.map((city) => (
                            <button
                                key={city.value}
                                type="button"
                                onClick={() => dispatch({ type: 'SET_FIELD', payload: { city: city.value } })}
                                className={cn(
                                    'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer text-center',
                                    state.city === city.value
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                                )}
                            >
                                {city.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm">{t('onboarding.address_label')}</Label>
                    <Input
                        value={state.workAddress}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { workAddress: e.target.value } })}
                        placeholder={t('onboarding.address_placeholder')}
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
