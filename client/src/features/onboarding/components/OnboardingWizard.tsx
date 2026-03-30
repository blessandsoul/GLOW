'use client';

import { Lock, Sparkle, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OnboardingPageMode } from './WizardLayout';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import { useOnboardingSubmit } from '../hooks/useOnboardingSubmit';
import { useLanguage } from '@/i18n/hooks/useLanguage';
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

interface SectionProps {
    locked?: boolean;
    lockMessage?: string;
    children: React.ReactNode;
    stepIndex: number;
    total: number;
}

function Section({ locked, lockMessage, children, stepIndex, total }: SectionProps): React.ReactElement {
    return (
        <div
            className={cn(
                'relative rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300',
                locked && 'opacity-40 pointer-events-none select-none',
            )}
        >
            {/* Step counter badge */}
            <div className="absolute -top-3 left-5 flex items-center gap-1.5">
                <span className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                    {stepIndex} / {total}
                </span>
            </div>

            <div className="p-5 sm:p-8">
                {locked ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                        <Lock size={24} className="text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">{lockMessage}</p>
                    </div>
                ) : children}
            </div>
        </div>
    );
}

export function OnboardingWizard(): React.ReactElement {
    const { state, dispatch } = useOnboardingWizard();
    const { submit, isSubmitting, error: submitError } = useOnboardingSubmit();
    const { t } = useLanguage();

    const noop = (): void => { /* no navigation in page mode */ };

    const commonProps: StepProps = {
        state,
        dispatch,
        goNext: noop,
        goBack: noop,
        isFirstStep: false,
        isLastStep: false,
        onSubmit: () => submit(state),
        isSubmitting,
        submitError,
    };

    const hasRole = !!state.role;
    const phoneVerified = state.phoneVerified;

    const roleSpecificSections = (): React.ReactNode => {
        if (!state.role) return null;

        if (state.role === 'USER') {
            return (
                <>
                    <Section stepIndex={3} total={6} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <UserCityStep {...commonProps} />
                    </Section>
                    <Section stepIndex={4} total={6} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <UserDobStep {...commonProps} />
                    </Section>
                    <Section stepIndex={5} total={6} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <UserCategoriesStep {...commonProps} />
                    </Section>
                    <Section stepIndex={6} total={6} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <UserFrequencyStep {...commonProps} />
                    </Section>
                </>
            );
        }

        if (state.role === 'MASTER') {
            return (
                <>
                    <Section stepIndex={3} total={7} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <MasterLocationStep {...commonProps} />
                    </Section>
                    <Section stepIndex={4} total={7} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <MasterSpecializationStep {...commonProps} />
                    </Section>
                    <Section stepIndex={5} total={7} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <MasterExperienceStep {...commonProps} />
                    </Section>
                    <Section stepIndex={6} total={7} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <MasterServicesStep {...commonProps} />
                    </Section>
                    <Section stepIndex={7} total={7} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                        <MasterPortfolioStep {...commonProps} />
                    </Section>
                </>
            );
        }

        // SALON
        return (
            <>
                <Section stepIndex={3} total={5} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                    <SalonInfoStep {...commonProps} />
                </Section>
                <Section stepIndex={4} total={5} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                    <SalonCategoriesStep {...commonProps} />
                </Section>
                <Section stepIndex={5} total={5} locked={!phoneVerified} lockMessage={t('onboarding.lock_phone')}>
                    <SalonPhotosStep {...commonProps} />
                </Section>
            </>
        );
    };

    return (
        <OnboardingPageMode.Provider value={true}>
            <div className="flex min-h-dvh">

                {/* Left panel */}
                <div
                    className="hidden lg:flex lg:w-[300px] xl:w-[360px] shrink-0 flex-col p-8 xl:p-10 sticky top-0 h-dvh"
                    style={{
                        background: 'linear-gradient(160deg, oklch(0.38 0.18 260) 0%, oklch(0.30 0.14 280) 50%, oklch(0.25 0.10 300) 100%)',
                    }}
                >
                    <div className="flex items-center gap-2 mb-12">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                            <Sparkle size={16} weight="fill" className="text-white" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-white">
                            {t('onboarding.brand')}
                        </span>
                    </div>

                    <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                            {t('onboarding.steps_label')}
                        </p>
                        <div className="flex flex-col gap-1">
                            <SidebarStep
                                index={1}
                                label={t('onboarding.role_title_short')}
                                done={hasRole}
                                active={!hasRole}
                            />
                            <SidebarStep
                                index={2}
                                label={t('onboarding.phone_title_short')}
                                done={phoneVerified}
                                active={hasRole && !phoneVerified}
                                locked={!hasRole}
                            />
                            {state.role === 'USER' && (
                                <>
                                    <SidebarStep index={3} label={t('onboarding.city_title_short')} done={!!state.city} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={4} label={t('onboarding.dob_title_short')} done={!!state.dateOfBirth} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={5} label={t('onboarding.categories_title_short')} done={state.interestedCategories.length > 0} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={6} label={t('onboarding.frequency_title_short')} done={!!state.visitFrequency} active={phoneVerified} locked={!phoneVerified} />
                                </>
                            )}
                            {state.role === 'MASTER' && (
                                <>
                                    <SidebarStep index={3} label={t('onboarding.location_title_short')} done={!!state.city && !!state.workAddress} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={4} label={t('onboarding.specialization_title_short')} done={state.niches.length > 0} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={5} label={t('onboarding.experience_title_short')} done={state.experienceYears !== null} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={6} label={t('onboarding.services_title_short')} done={state.services.length > 0} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={7} label={t('onboarding.portfolio_title_short')} done={state.portfolioItemIds.length >= 3} active={phoneVerified} locked={!phoneVerified} />
                                </>
                            )}
                            {state.role === 'SALON' && (
                                <>
                                    <SidebarStep index={3} label={t('onboarding.salon_info_short')} done={!!state.salonName} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={4} label={t('onboarding.categories_title_short')} done={state.serviceCategories.length > 0} active={phoneVerified} locked={!phoneVerified} />
                                    <SidebarStep index={5} label={t('onboarding.salon_photos_short')} done={state.portfolioItemIds.length > 0} active={phoneVerified} locked={!phoneVerified} />
                                </>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-white/30 leading-relaxed">
                        {t('onboarding.brand_quote')}
                    </p>
                </div>

                {/* Right panel — scrollable sections */}
                <div className="flex-1 overflow-y-auto">
                    {/* Mobile top bar */}
                    <div className="flex lg:hidden items-center gap-2 px-5 py-4 border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                            <Sparkle size={14} weight="fill" className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{t('onboarding.brand')}</span>
                    </div>

                    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

                        {/* Section 1: Role */}
                        <Section stepIndex={1} total={hasRole ? (state.role === 'USER' ? 6 : state.role === 'MASTER' ? 7 : 5) : 2}>
                            <RoleSelectionStep {...commonProps} />
                        </Section>

                        {/* Section 2: Phone */}
                        <Section
                            stepIndex={2}
                            total={hasRole ? (state.role === 'USER' ? 6 : state.role === 'MASTER' ? 7 : 5) : 2}
                            locked={!hasRole}
                            lockMessage={t('onboarding.lock_role')}
                        >
                            <PhoneVerificationStep {...commonProps} />
                        </Section>

                        {/* Role-specific sections */}
                        {roleSpecificSections()}

                        {/* Submit */}
                        {hasRole && (
                            <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-8 shadow-sm">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                        <CheckCircle size={24} weight="duotone" className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">{t('onboarding.submit_title')}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.submit_subtitle')}</p>
                                    </div>
                                    {submitError && (
                                        <p className="text-sm text-destructive">{submitError}</p>
                                    )}
                                    <Button
                                        onClick={() => submit(state)}
                                        disabled={isSubmitting || !phoneVerified}
                                        className="w-full gap-2"
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                                {t('onboarding.btn_submitting')}
                                            </>
                                        ) : t('onboarding.btn_complete')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </OnboardingPageMode.Provider>
    );
}

interface SidebarStepProps {
    index: number;
    label: string;
    done: boolean;
    active: boolean;
    locked?: boolean;
}

function SidebarStep({ index, label, done, active, locked }: SidebarStepProps): React.ReactElement {
    return (
        <div className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
            active && !done && 'bg-white/10',
        )}>
            <div className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300',
                done && 'bg-white text-primary',
                active && !done && 'bg-white text-primary ring-4 ring-white/20',
                locked && 'bg-white/10 text-white/30',
                !done && !active && !locked && 'bg-white/15 text-white/50',
            )}>
                {done ? <CheckCircle size={14} weight="fill" /> : index}
            </div>
            <span className={cn(
                'text-sm font-medium transition-colors duration-200',
                done && 'text-white/60',
                active && !done && 'text-white',
                locked && 'text-white/25',
                !done && !active && !locked && 'text-white/40',
            )}>
                {label}
            </span>
        </div>
    );
}
