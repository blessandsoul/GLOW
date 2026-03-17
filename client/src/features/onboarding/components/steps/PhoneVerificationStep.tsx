'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { OtpInput } from '@/components/common/OtpInput';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { WizardLayout } from '../WizardLayout';
import { cn } from '@/lib/utils';
import type { StepProps } from '../OnboardingWizard';

export function PhoneVerificationStep({ state, dispatch, goNext, goBack }: StepProps): React.ReactElement {
    const { setPhone, verifyPhone, resendOtp, isVerifying, verifyError } = useAuth();
    const user = useAppSelector((s) => s.auth.user);
    const { t } = useLanguage();

    const [phone, setPhoneValue] = useState('');
    const [otpRequestId, setOtpRequestId] = useState<string | null>(
        () => sessionStorage.getItem('otp_request_id'),
    );
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const hasAutoAdvanced = useRef(false);

    // If phone already verified, auto-advance ONCE
    useEffect(() => {
        if (user?.isPhoneVerified && !hasAutoAdvanced.current) {
            hasAutoAdvanced.current = true;
            dispatch({ type: 'SET_PHONE_VERIFIED' });
            // Small delay so user sees the step briefly
            const timer = setTimeout(() => goNext(), 300);
            return () => clearTimeout(timer);
        }
    }, [user?.isPhoneVerified, dispatch, goNext]);

    const alreadyVerified = !!user?.isPhoneVerified;
    const alreadyHasPhone = !!user?.phone;
    const needsPhoneInput = !alreadyHasPhone && !otpRequestId && !alreadyVerified;
    const showOtp = !alreadyVerified && (!!otpRequestId || alreadyHasPhone);

    const handleSendOtp = async (): Promise<void> => {
        if (!phone || phone.length !== 9) return;
        setIsSending(true);
        setSendError(null);
        const requestId = await setPhone(phone);
        if (requestId) {
            setOtpRequestId(requestId);
        } else {
            setSendError(t('onboarding.phone_send_error'));
        }
        setIsSending(false);
    };

    const handleVerify = async (code: string): Promise<void> => {
        const reqId = otpRequestId ?? sessionStorage.getItem('otp_request_id');
        if (!reqId) return;
        await verifyPhone(reqId, code);
    };

    const handleResend = async (): Promise<void> => {
        const newId = await resendOtp();
        if (newId) setOtpRequestId(newId);
    };

    // After successful verification, user.isPhoneVerified updates via Redux → useEffect advances

    if (alreadyVerified) {
        return (
            <WizardLayout
                title={t('onboarding.phone_verified_title')}
                subtitle={t('onboarding.phone_verified_subtitle')}
                showBack={false}
                showNext={false}
            >
                <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>

                {/* Marketing consents still editable */}
                <ConsentCheckboxes state={state} dispatch={dispatch} />
            </WizardLayout>
        );
    }

    return (
        <WizardLayout
            title={t('onboarding.phone_title')}
            subtitle={t('onboarding.phone_subtitle')}
            showBack={true}
            showNext={false}
            onBack={goBack}
        >
            {needsPhoneInput && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm">{t('onboarding.phone_label')}</Label>
                        <div className="flex gap-2">
                            <div className="flex h-10 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground">
                                +995
                            </div>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder={t('onboarding.phone_placeholder')}
                                className="rounded-xl"
                                maxLength={9}
                            />
                        </div>
                        {sendError && (
                            <p className="text-xs text-destructive">{sendError}</p>
                        )}
                    </div>
                    <Button
                        onClick={handleSendOtp}
                        disabled={phone.length !== 9 || isSending}
                        className="w-full"
                    >
                        {isSending ? t('onboarding.phone_sending') : t('onboarding.phone_send')}
                    </Button>
                </div>
            )}

            {showOtp && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <p className="text-center text-sm text-muted-foreground">
                            {t('onboarding.phone_otp_hint')}
                        </p>
                        <OtpInput
                            onComplete={handleVerify}
                            error={verifyError?.message}
                            disabled={isVerifying}
                        />
                        {verifyError && (
                            <p className="text-center text-xs text-destructive">{verifyError.message}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleResend}
                        className="mx-auto block text-xs text-primary transition-colors hover:text-primary/80"
                    >
                        {t('onboarding.phone_resend')}
                    </button>
                </div>
            )}

            <ConsentCheckboxes state={state} dispatch={dispatch} />
        </WizardLayout>
    );
}

function ConsentCheckboxes({ state, dispatch }: Pick<StepProps, 'state' | 'dispatch'>): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="mt-6 space-y-2 border-t border-border/50 pt-4">
            <p className="text-xs font-medium text-muted-foreground">{t('onboarding.consent_title')}</p>
            {([
                { key: 'smsAppointments', label: t('onboarding.consent_appointments') },
                { key: 'smsPromotions', label: t('onboarding.consent_promotions') },
                { key: 'smsNews', label: t('onboarding.consent_news') },
            ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={state[key]}
                        onClick={() => dispatch({ type: 'SET_FIELD', payload: { [key]: !state[key] } })}
                        className={cn(
                            'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150',
                            state[key]
                                ? 'border-primary bg-primary'
                                : 'border-border bg-card hover:border-primary/50',
                        )}
                    >
                        {state[key] && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                    <span className="text-xs text-foreground">{label}</span>
                </label>
            ))}
        </div>
    );
}
