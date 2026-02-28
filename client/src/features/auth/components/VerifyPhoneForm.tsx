'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, SpinnerGap, ArrowClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Logo } from '@/components/layout/Logo';
import { getErrorMessage } from '@/lib/utils/error';

export function VerifyPhoneForm(): React.ReactElement {
    const { user, verifyPhone, resendOtp, isVerifying, verifyError } = useAuth();
    const { t } = useLanguage();
    const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [requestId, setRequestId] = useState('');
    const [resendCooldown, setResendCooldown] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Mask phone: +995 5XX XXX X65 -> show first digit after +995 and last 2
    const maskedPhone = user?.phone
        ? `+995 ${user.phone[4]}** *** *${user.phone.slice(-2)}`
        : '';

    // Load requestId from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('otp_request_id');
        if (stored) {
            setRequestId(stored);
        }
    }, []);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        return (): void => {
            clearInterval(timer);
        };
    }, [resendCooldown]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleDigitChange = useCallback((index: number, value: string): void => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...digits];
        newDigits[index] = value.slice(-1);
        setDigits(newDigits);

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits filled
        const code = newDigits.join('');
        if (code.length === 6 && newDigits.every(d => d !== '')) {
            const currentRequestId = requestId || sessionStorage.getItem('otp_request_id') || '';
            if (currentRequestId) {
                verifyPhone(currentRequestId, code);
            }
        }
    }, [digits, requestId, verifyPhone]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent): void => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [digits]);

    const handlePaste = useCallback((e: React.ClipboardEvent): void => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newDigits = [...digits];
        for (let i = 0; i < pasted.length; i++) {
            newDigits[i] = pasted[i];
        }
        setDigits(newDigits);

        const nextEmpty = newDigits.findIndex(d => d === '');
        inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();

        if (pasted.length === 6) {
            const currentRequestId = requestId || sessionStorage.getItem('otp_request_id') || '';
            if (currentRequestId) {
                verifyPhone(currentRequestId, pasted);
            }
        }
    }, [digits, requestId, verifyPhone]);

    const handleResend = async (): Promise<void> => {
        setIsResending(true);
        const newRequestId = await resendOtp();
        setIsResending(false);
        if (newRequestId) {
            setRequestId(newRequestId);
            setDigits(['', '', '', '', '', '']);
            setResendCooldown(60);
            inputRefs.current[0]?.focus();
            toast.success(t('auth.code_sent'));
        }
    };

    const handleManualSubmit = (): void => {
        const code = digits.join('');
        if (code.length !== 6) return;
        const currentRequestId = requestId || sessionStorage.getItem('otp_request_id') || '';
        if (currentRequestId) {
            verifyPhone(currentRequestId, code);
        }
    };

    const allDigitsFilled = digits.every(d => d !== '');

    return (
        <Card className="border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="items-center gap-1 pb-6 pt-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        <ShieldCheck size={20} weight="fill" />
                    </div>
                    <Logo size="md" href="/" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                    {t('auth.verify_phone_title')}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    {t('auth.verify_phone_desc')}{' '}
                    {maskedPhone && (
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                            {maskedPhone}
                        </span>
                    )}
                </p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                    {verifyError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {getErrorMessage(verifyError)}
                        </div>
                    )}

                    {/* OTP digit inputs */}
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                        {digits.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                aria-label={`${t('auth.digit')} ${index + 1}`}
                                className={`h-12 w-12 text-center text-lg font-semibold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 rounded-xl ${
                                    verifyError ? 'border-red-500 focus-visible:ring-red-500/20' : ''
                                }`}
                            />
                        ))}
                    </div>

                    {/* Verify button (manual fallback) */}
                    <Button
                        type="button"
                        onClick={handleManualSubmit}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl"
                        disabled={isVerifying || !allDigitsFilled}
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

                    {/* Resend code */}
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
                </div>
            </CardContent>
        </Card>
    );
}
