'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, SpinnerGap, ArrowClockwise, Phone } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { OtpInput } from '@/components/common/OtpInput';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Logo } from '@/components/layout/Logo';
import { getErrorMessage } from '@/lib/utils/error';

type Step = 'enterPhone' | 'verifyOtp';

export function VerifyPhoneForm(): React.ReactElement {
    const { user, verifyPhone, resendOtp, setPhone, isVerifying, verifyError } = useAuth();
    const { t } = useLanguage();

    const needsPhoneInput = !user?.phone;
    const [step, setStep] = useState<Step>(needsPhoneInput ? 'enterPhone' : 'verifyOtp');

    // Phone input state
    const [phoneValue, setPhoneValue] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [isSettingPhone, setIsSettingPhone] = useState(false);

    // OTP state
    const [requestId, setRequestId] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [otpKey, setOtpKey] = useState(0);

    const displayPhone = user?.phone || (phoneValue ? `+995${phoneValue}` : '');
    const maskedPhone = displayPhone
        ? `+995 ${displayPhone[4]}** *** *${displayPhone.slice(-2)}`
        : '';

    useEffect(() => {
        if (step !== 'verifyOtp') return;
        const stored = sessionStorage.getItem('otp_request_id');
        if (stored) {
            setRequestId(stored);
            setResendCooldown(60);
        } else if (user?.phone) {
            resendOtp().then((newId) => {
                if (newId) {
                    setRequestId(newId);
                    setResendCooldown(60);
                }
            });
        }
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        return (): void => { clearInterval(timer); };
    }, [resendCooldown]);

    const handlePhoneSubmit = async (): Promise<void> => {
        setPhoneError('');
        if (!/^\d{9}$/.test(phoneValue)) {
            setPhoneError(t('validation.phone_georgian'));
            return;
        }

        setIsSettingPhone(true);
        const newRequestId = await setPhone(`+995${phoneValue}`);
        setIsSettingPhone(false);

        if (newRequestId) {
            setRequestId(newRequestId);
            setResendCooldown(60);
            setStep('verifyOtp');
        }
    };

    const handleOtpComplete = useCallback((code: string): void => {
        const currentRequestId = requestId || sessionStorage.getItem('otp_request_id') || '';
        if (currentRequestId) {
            verifyPhone(currentRequestId, code);
        }
    }, [requestId, verifyPhone]);

    const handleResend = async (): Promise<void> => {
        setIsResending(true);
        const newRequestId = await resendOtp();
        setIsResending(false);
        if (newRequestId) {
            setRequestId(newRequestId);
            setResendCooldown(60);
            setOtpKey((k) => k + 1);
            toast.success(t('auth.code_sent'));
        }
    };

    return (
        <Card className="border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="items-center gap-1 pb-6 pt-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        {step === 'enterPhone' ? <Phone size={20} weight="fill" /> : <ShieldCheck size={20} weight="fill" />}
                    </div>
                    <Logo size="md" href="/" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                    {step === 'enterPhone' ? t('auth.add_phone_title') : t('auth.verify_phone_title')}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    {step === 'enterPhone'
                        ? t('auth.add_phone_desc')
                        : (
                            <>
                                {t('auth.verify_phone_desc')}{' '}
                                {maskedPhone && (
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                                        {maskedPhone}
                                    </span>
                                )}
                            </>
                        )
                    }
                </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                    {(verifyError || phoneError) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {phoneError || (verifyError ? getErrorMessage(verifyError) : '')}
                        </div>
                    )}

                    {step === 'enterPhone' ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-zinc-700 dark:text-zinc-300">{t('auth.phone')}</Label>
                                <div className={`flex rounded-xl overflow-hidden border ${phoneError ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                    <span className="flex items-center px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-medium border-r border-zinc-200 dark:border-zinc-800 select-none shrink-0">
                                        +995
                                    </span>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="5XX XXX XXX"
                                        autoComplete="tel-national"
                                        maxLength={9}
                                        value={phoneValue}
                                        onChange={(e) => {
                                            setPhoneValue(e.target.value.replace(/\D/g, ''));
                                            setPhoneError('');
                                        }}
                                        className={`border-0 rounded-none bg-zinc-50 dark:bg-zinc-950 focus-visible:ring-primary/20 focus-visible:ring-inset ${phoneError ? 'focus-visible:ring-red-500/20' : ''}`}
                                    />
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handlePhoneSubmit}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl"
                                disabled={isSettingPhone || phoneValue.length !== 9}
                            >
                                {isSettingPhone ? (
                                    <>
                                        <SpinnerGap size={18} className="mr-2 animate-spin" />
                                        {t('auth.sending_code')}
                                    </>
                                ) : (
                                    t('auth.send_code')
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <OtpInput
                                key={otpKey}
                                onComplete={handleOtpComplete}
                                error={verifyError ? getErrorMessage(verifyError) : null}
                                disabled={isVerifying}
                                digitLabel={t('auth.digit')}
                            />

                            <Button
                                type="button"
                                onClick={() => {
                                    // Trigger manual submit - OtpInput auto-submits on complete
                                }}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl"
                                disabled={isVerifying}
                            >
                                {isVerifying ? (
                                    <>
                                        <SpinnerGap size={18} className="mr-2 animate-spin" />
                                        {t('auth.verifying')}
                                    </>
                                ) : (
                                    t('auth.verify_btn')
                                )}
                            </Button>

                            <div className="text-center">
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {t('auth.resend_in')}{' '}
                                        <span className="font-medium tabular-nums">{resendCooldown}s</span>
                                    </p>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleResend}
                                        disabled={isResending}
                                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        {isResending ? (
                                            <SpinnerGap size={16} className="mr-1.5 animate-spin" />
                                        ) : (
                                            <ArrowClockwise size={16} className="mr-1.5" />
                                        )}
                                        {t('auth.resend_code')}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
