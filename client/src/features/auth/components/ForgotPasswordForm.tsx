'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, SpinnerGap, Eye, EyeSlash, ArrowLeft, ArrowClockwise, ShieldCheck } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OtpInput } from '@/components/common/OtpInput';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Logo } from '@/components/layout/Logo';

type Step = 'email' | 'otp' | 'password';

interface RecoveryState {
    recoveryToken: string;
    requestId: string;
    maskedPhone: string;
    email: string;
}

export function ForgotPasswordForm(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();

    const [step, setStep] = useState<Step>('email');
    const [recovery, setRecovery] = useState<RecoveryState | null>(null);
    const [otpCode, setOtpCode] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpKey, setOtpKey] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const emailSchema = z.object({
        email: z.string().email(t('validation.email_invalid')),
    });

    const passwordSchema = z.object({
        password: z
            .string()
            .min(8, t('ui.profile_err_min_8'))
            .regex(/[A-Z]/, t('ui.profile_err_uppercase'))
            .regex(/[a-z]/, t('ui.profile_err_lowercase'))
            .regex(/[0-9]/, t('ui.profile_err_number')),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('ui.profile_err_mismatch'),
        path: ['confirmPassword'],
    });

    const emailForm = useForm<{ email: string }>({
        resolver: zodResolver(emailSchema),
    });

    const passwordForm = useForm<{ password: string; confirmPassword: string }>({
        resolver: zodResolver(passwordSchema),
    });

    const startCooldown = useCallback((): void => {
        setResendCooldown(60);
        const timer = setInterval(() => {
            setResendCooldown((c) => {
                if (c <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    }, []);

    const handleEmailSubmit = useCallback(async (data: { email: string }): Promise<void> => {
        setIsSending(true);
        setEmailError(null);
        try {
            const result = await authService.recoverPasswordRequest(data.email);
            setRecovery({
                recoveryToken: result.recoveryToken,
                requestId: result.requestId,
                maskedPhone: result.maskedPhone,
                email: data.email,
            });
            setStep('otp');
            startCooldown();
        } catch (error) {
            setEmailError(getErrorMessage(error));
        } finally {
            setIsSending(false);
        }
    }, [startCooldown]);

    const handleOtpComplete = useCallback((code: string): void => {
        setOtpCode(code);
        setOtpError(null);
        setStep('password');
    }, []);

    const handlePasswordSubmit = useCallback(async (data: { password: string; confirmPassword: string }): Promise<void> => {
        if (!recovery) return;
        setIsResetting(true);
        try {
            await authService.recoverPassword(
                recovery.recoveryToken,
                recovery.requestId,
                otpCode,
                data.password,
            );
            toast.success(t('auth.recover_success'));
            router.push('/login');
        } catch (error) {
            const msg = getErrorMessage(error);
            // If OTP is invalid, go back to OTP step
            if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('otp')) {
                setOtpError(msg);
                setOtpCode('');
                setOtpKey((k) => k + 1);
                setStep('otp');
            } else {
                toast.error(msg);
            }
        } finally {
            setIsResetting(false);
        }
    }, [recovery, otpCode, router, t]);

    const handleResend = useCallback(async (): Promise<void> => {
        if (!recovery) return;
        setIsSending(true);
        setOtpError(null);
        try {
            const result = await authService.recoverPasswordRequest(recovery.email);
            setRecovery({
                recoveryToken: result.recoveryToken,
                requestId: result.requestId,
                maskedPhone: result.maskedPhone,
                email: recovery.email,
            });
            setOtpKey((k) => k + 1);
            startCooldown();
            toast.success(t('auth.code_sent'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSending(false);
        }
    }, [recovery, startCooldown, t]);

    return (
        <Card className="border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="items-center gap-1 pb-6 pt-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        <Star size={20} weight="fill" />
                    </div>
                    <Logo size="md" href="/" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                    {t('auth.recover_title')}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {step === 'email' && t('auth.recover_desc')}
                    {step === 'otp' && (
                        <>
                            {t('auth.recover_code_sent')}{' '}
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                                {recovery?.maskedPhone}
                            </span>
                        </>
                    )}
                    {step === 'password' && t('auth.recover_set_password_desc')}
                </p>
            </CardHeader>

            <CardContent className="px-8 pb-8">
                {/* Step 1: Email */}
                {step === 'email' && (
                    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                        {emailError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                                {emailError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={cn(
                                    'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20',
                                    emailForm.formState.errors.email && 'border-red-500 focus-visible:ring-red-500/20',
                                )}
                                {...emailForm.register('email')}
                            />
                            {emailForm.formState.errors.email && (
                                <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl"
                            disabled={isSending}
                        >
                            {isSending ? (
                                <>
                                    <SpinnerGap size={18} className="mr-2 animate-spin" />
                                    {t('auth.recover_sending')}
                                </>
                            ) : (
                                t('auth.recover_send_code')
                            )}
                        </Button>

                        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-2">
                            <Link
                                href="/login"
                                className="font-semibold text-primary transition-colors hover:text-primary/80"
                            >
                                {t('auth.recover_back_to_login')}
                            </Link>
                        </p>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                    <div className="space-y-4">
                        {otpError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                                {otpError}
                            </div>
                        )}

                        <OtpInput
                            key={otpKey}
                            onComplete={handleOtpComplete}
                            error={otpError}
                            disabled={isSending}
                            digitLabel={t('auth.digit')}
                        />

                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => { setStep('email'); setOtpError(null); }}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft size={14} />
                                {t('auth.recover_back_to_login')}
                            </Button>

                            {resendCooldown > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    {t('auth.resend_in')}{' '}
                                    <span className="font-medium tabular-nums">{resendCooldown}s</span>
                                </p>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResend}
                                    disabled={isSending}
                                    className="gap-1.5 text-primary hover:text-primary/80"
                                >
                                    {isSending ? (
                                        <SpinnerGap size={14} className="animate-spin" />
                                    ) : (
                                        <ArrowClockwise size={14} />
                                    )}
                                    {t('auth.resend_code')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: New Password */}
                {step === 'password' && (
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <ShieldCheck size={18} className="text-primary shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                {t('auth.recover_verified')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">
                                {t('auth.recover_new_password')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={cn(
                                        'pr-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20',
                                        passwordForm.formState.errors.password && 'border-red-500 focus-visible:ring-red-500/20',
                                    )}
                                    {...passwordForm.register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {passwordForm.formState.errors.password && (
                                <p className="text-sm text-red-500">{passwordForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">
                                {t('auth.recover_confirm_password')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={cn(
                                        'pr-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20',
                                        passwordForm.formState.errors.confirmPassword && 'border-red-500 focus-visible:ring-red-500/20',
                                    )}
                                    {...passwordForm.register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeSlash size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl"
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <SpinnerGap size={18} className="mr-2 animate-spin" />
                                    {t('auth.recover_resetting')}
                                </>
                            ) : (
                                t('auth.recover_reset_btn')
                            )}
                        </Button>

                        <div className="text-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('otp')}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft size={14} />
                                {t('auth.recover_back_to_otp')}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
