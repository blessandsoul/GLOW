'use client';

import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useOnboardingSubmit } from '../hooks/useOnboardingSubmit';
import { WizardProgress } from './WizardProgress';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { PhoneVerificationStep } from './steps/PhoneVerificationStep';
import { UserCityStep } from './steps/user/UserCityStep';
import { UserDobStep } from './steps/user/UserDobStep';
import { UserCategoriesStep } from './steps/user/UserCategoriesStep';
import { UserFrequencyStep } from './steps/user/UserFrequencyStep';
import { MasterLocationStep } from './steps/master/MasterLocationStep';
import { MasterSpecializationStep } from './steps/master/MasterSpecializationStep';
import { MasterExperienceStep } from './steps/master/MasterExperienceStep';
import { MasterServicesStep } from './steps/master/MasterServicesStep';
import { MasterPortfolioStep } from './steps/master/MasterPortfolioStep';
import { SalonInfoStep } from './steps/salon/SalonInfoStep';
import { SalonCategoriesStep } from './steps/salon/SalonCategoriesStep';
import { SalonPhotosStep } from './steps/salon/SalonPhotosStep';

const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
    'role': RoleSelectionStep,
    'phone': PhoneVerificationStep,
    'user-city': UserCityStep,
    'user-dob': UserDobStep,
    'user-categories': UserCategoriesStep,
    'user-frequency': UserFrequencyStep,
    'master-location': MasterLocationStep,
    'master-specialization': MasterSpecializationStep,
    'master-experience': MasterExperienceStep,
    'master-services': MasterServicesStep,
    'master-portfolio': MasterPortfolioStep,
    'salon-info': SalonInfoStep,
    'salon-categories': SalonCategoriesStep,
    'salon-photos': SalonPhotosStep,
};

export interface StepProps {
    state: ReturnType<typeof useOnboardingWizard>['state'];
    dispatch: ReturnType<typeof useOnboardingWizard>['dispatch'];
    goNext: () => void;
    goBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    onSubmit: () => void;
    isSubmitting: boolean;
    submitError: string | null;
}

export function OnboardingWizard(): React.ReactElement {
    const { state, dispatch, steps, currentStepConfig, isLastStep, isFirstStep, goNext, goBack } = useOnboardingWizard();
    const { submit, isSubmitting, error: submitError } = useOnboardingSubmit();

    const handleSubmit = (): void => {
        submit(state);
    };

    const stepId = currentStepConfig?.id ?? 'role';
    const StepComponent = STEP_COMPONENTS[stepId];

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-medium tracking-widest uppercase text-primary">Glow.GE</p>
                <WizardProgress steps={steps} currentStep={state.currentStep} />
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
                {StepComponent && (
                    <StepComponent
                        key={stepId}
                        state={state}
                        dispatch={dispatch}
                        goNext={goNext}
                        goBack={goBack}
                        isFirstStep={isFirstStep}
                        isLastStep={isLastStep}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        submitError={submitError}
                    />
                )}
            </div>
        </div>
    );
}
