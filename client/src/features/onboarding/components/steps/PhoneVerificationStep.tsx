'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';
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

    const [phone, setPhoneValue] = useState('');
    const [otpRequestId, setOtpRequestId] = useState<string | null>(
        () => sessionStorage.getItem('otp_request_id'),
    );
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    // If phone already verified (e.g. restoring from localStorage), skip to next
    useEffect(() => {
        if (user?.isPhoneVerified) {
            dispatch({ type: 'SET_PHONE_VERIFIED' });
            goNext();
        }
    }, [user?.isPhoneVerified, dispatch, goNext]);

    const alreadyHasPhone = !!user?.phone;
    const needsPhoneInput = !alreadyHasPhone && !otpRequestId;
    const showOtp = !!otpRequestId || alreadyHasPhone;

    const handleSendOtp = async (): Promise<void> => {
        if (!phone || phone.length !== 9) return;
        setIsSending(true);
        setSendError(null);
        const requestId = await setPhone(phone);
        if (requestId) {
            setOtpRequestId(requestId);
        } else {
            setSendError('Failed to send verification code');
        }
        setIsSending(false);
    };

    const handleVerify = async (code: string): Promise<void> => {
        const reqId = otpRequestId ?? sessionStorage.getItem('otp_request_id');
        if (!reqId) return;
        await verifyPhone(reqId, code);
        // useAuth.verifyPhone dispatches setUser which updates user.isPhoneVerified
        // The useEffect above will detect it and advance
    };

    const handleResend = async (): Promise<void> => {
        const newId = await resendOtp();
        if (newId) setOtpRequestId(newId);
    };

    return (
        <WizardLayout
            title="Verify your phone"
            subtitle="We'll send you a verification code"
            showBack={true}
            showNext={false}
            onBack={goBack}
        >
            {needsPhoneInput && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm">Phone number</Label>
                        <div className="flex gap-2">
                            <div className="flex h-10 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground">
                                +995
                            </div>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder="5XX XXX XXX"
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
                        {isSending ? 'Sending...' : 'Send code'}
                    </Button>
                </div>
            )}

            {showOtp && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <p className="text-center text-sm text-muted-foreground">
                            Enter the 6-digit code sent to your phone
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
                        Resend code
                    </button>
                </div>
            )}

            {/* Marketing consents */}
            <div className="mt-6 space-y-2 border-t border-border/50 pt-4">
                <p className="text-xs font-medium text-muted-foreground">Notifications</p>
                {([
                    { key: 'smsAppointments', label: 'Appointment reminders & updates' },
                    { key: 'smsPromotions', label: 'Promotions & special offers' },
                    { key: 'smsNews', label: 'News & updates from Glow.GE' },
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
        </WizardLayout>
    );
}
