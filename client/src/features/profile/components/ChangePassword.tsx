'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, SpinnerGap, LockKey, ShieldCheck, ArrowLeft, ArrowClockwise, Key, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OtpInput } from '@/components/common/OtpInput';
import { authService } from '@/features/auth/services/auth.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout as logoutAction } from '@/features/auth/store/authSlice';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';

type Step = 'form' | 'otp';

interface PasswordField {
    current: string;
    next: string;
    confirm: string;
}

interface FieldErrors {
    current?: string;
    next?: string;
    confirm?: string;
}

function maskPhone(phone: string): string {
    if (phone.length < 6) return phone;
    return `+995 ${phone[4]}** *** *${phone.slice(-2)}`;
}

export function ChangePassword(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.auth.user);

    const hasPassword = user?.hasPassword ?? true;
    const hasVerifiedPhone = Boolean(user?.phone && user?.isPhoneVerified);

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<Step>('form');
    const [fields, setFields] = useState<PasswordField>({ current: '', next: '', confirm: '' });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [isSending, setIsSending] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [requestId, setRequestId] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpKey, setOtpKey] = useState(0);
    const [otpError, setOtpError] = useState<string | null>(null);

    // Cooldown timer
    useState(() => {
        // Using useState initializer just to set up interval tracking
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

    const validate = useCallback((f: PasswordField): FieldErrors => {
        const errs: FieldErrors = {};
        if (hasPassword && !f.current) errs.current = t('ui.profile_err_current_required');
        if (f.next.length < 8) errs.next = t('ui.profile_err_min_8');
        else if (!/[A-Z]/.test(f.next)) errs.next = t('ui.profile_err_uppercase');
        else if (!/[a-z]/.test(f.next)) errs.next = t('ui.profile_err_lowercase');
        else if (!/[0-9]/.test(f.next)) errs.next = t('ui.profile_err_number');
        if (f.next && f.confirm && f.next !== f.confirm) {
            errs.confirm = t('ui.profile_err_mismatch');
        }
        return errs;
    }, [t, hasPassword]);

    const handleChange = useCallback((field: keyof PasswordField, value: string): void => {
        setFields((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }, []);

    const handleSubmitForm = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const errs = validate(fields);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setIsSending(true);
        try {
            const result = await authService.changePasswordRequestOtp(
                fields.next,
                hasPassword ? fields.current : undefined,
            );
            setRequestId(result.requestId);
            setStep('otp');
            startCooldown();
            setOtpError(null);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSending(false);
        }
    }, [fields, hasPassword, validate, startCooldown]);

    const handleOtpComplete = useCallback(async (code: string): Promise<void> => {
        setIsChanging(true);
        setOtpError(null);
        try {
            await authService.changePassword(
                fields.next,
                requestId,
                code,
                hasPassword ? fields.current : undefined,
            );
            toast.success(t('ui.profile_password_success'));
            dispatch(logoutAction());
            router.push('/login');
        } catch (error) {
            const msg = getErrorMessage(error);
            setOtpError(msg);
            setIsChanging(false);
        }
    }, [fields, requestId, hasPassword, dispatch, router, t]);

    const handleResend = useCallback(async (): Promise<void> => {
        setIsSending(true);
        setOtpError(null);
        try {
            const result = await authService.changePasswordRequestOtp(
                fields.next,
                hasPassword ? fields.current : undefined,
            );
            setRequestId(result.requestId);
            setOtpKey((k) => k + 1);
            startCooldown();
            toast.success(t('ui.profile_otp_sent'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSending(false);
        }
    }, [fields, hasPassword, startCooldown, t]);

    const handleBack = useCallback((): void => {
        setStep('form');
        setOtpError(null);
    }, []);

    const toggleShow = useCallback((field: keyof typeof show): void => {
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const title = hasPassword ? t('ui.profile_change_password') : t('ui.profile_set_password');

    // Pre-check: user needs verified phone
    if (!hasVerifiedPhone) {
        return (
            <section className="rounded-xl border border-border/50 bg-card">
                <button
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    className="flex w-full items-center gap-3 p-5 text-left"
                >
                    <LockKey size={16} className="shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
                    <CaretRight
                        size={14}
                        className={cn('shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-90')}
                    />
                </button>
                {isOpen && (
                    <div className="border-t border-border/50 px-5 pb-5 pt-4">
                        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                            <ShieldCheck size={20} className="text-warning shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                                {t('ui.profile_no_phone')}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        );
    }

    const maskedPhone = maskPhone(user!.phone!);

    // Determine which fields to show
    const fieldConfig = hasPassword
        ? [
            { id: 'current', label: t('ui.profile_current_password'), field: 'current' as const },
            { id: 'next', label: t('ui.profile_new_password'), field: 'next' as const },
            { id: 'confirm', label: t('ui.profile_confirm_password'), field: 'confirm' as const },
        ]
        : [
            { id: 'next', label: t('ui.profile_new_password'), field: 'next' as const },
            { id: 'confirm', label: t('ui.profile_confirm_password'), field: 'confirm' as const },
        ];

    return (
        <section className="rounded-xl border border-border/50 bg-card">
            {/* Collapsed header row */}
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className="flex w-full items-center gap-3 p-5 text-left"
            >
                {step === 'otp' ? (
                    <ShieldCheck size={16} className="shrink-0 text-primary" />
                ) : hasPassword ? (
                    <LockKey size={16} className="shrink-0 text-muted-foreground" />
                ) : (
                    <Key size={16} className="shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm font-medium text-foreground">
                    {step === 'otp' ? t('ui.profile_otp_title') : title}
                </span>
                <CaretRight
                    size={14}
                    className={cn('shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-90')}
                />
            </button>

            {/* Expandable form */}
            {isOpen && (
                <div className="border-t border-border/50 px-5 pb-5 pt-4 space-y-4">
                    {step === 'form' ? (
                        <>
                            {!hasPassword && (
                                <p className="text-xs text-muted-foreground">
                                    {t('ui.profile_set_password_desc')}
                                </p>
                            )}
                            <form onSubmit={handleSubmitForm} className="space-y-4">
                                <input type="text" name="username" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden="true" />
                                {fieldConfig.map(({ id, label, field }) => (
                                    <div key={id} className="space-y-1.5">
                                        <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
                                        <div className="relative">
                                            <Input
                                                id={id}
                                                type={show[field] ? 'text' : 'password'}
                                                value={fields[field]}
                                                onChange={(e) => handleChange(field, e.target.value)}
                                                className={cn('pr-10', errors[field] && 'border-destructive focus-visible:ring-destructive/30')}
                                                autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShow(field)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                aria-label={show[field] ? 'Hide password' : 'Show password'}
                                            >
                                                {show[field] ? <EyeSlash size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {errors[field] && (
                                            <p className="text-xs text-destructive">{errors[field]}</p>
                                        )}
                                    </div>
                                ))}

                                <Button type="submit" size="sm" disabled={isSending} className="gap-1.5">
                                    {isSending && <SpinnerGap size={14} className="animate-spin" />}
                                    {isSending
                                        ? t('ui.profile_otp_sending')
                                        : (hasPassword ? t('ui.profile_update_password') : t('ui.profile_set_password_btn'))
                                    }
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                {t('ui.profile_otp_desc')}{' '}
                                <span className="font-medium text-foreground tabular-nums">{maskedPhone}</span>
                            </p>

                            {otpError && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                                    {otpError}
                                </div>
                            )}

                            <OtpInput
                                key={otpKey}
                                onComplete={handleOtpComplete}
                                error={otpError}
                                disabled={isChanging}
                                digitLabel={t('ui.profile_otp_digit')}
                            />

                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBack}
                                    disabled={isChanging}
                                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft size={14} />
                                    {t('ui.profile_otp_back')}
                                </Button>

                                {resendCooldown > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('ui.profile_otp_resend_in')}{' '}
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
                                        {t('ui.profile_otp_resend')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
