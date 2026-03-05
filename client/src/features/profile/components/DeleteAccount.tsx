'use client';

import { useState, useCallback } from 'react';
import { Trash, Warning, SpinnerGap, ShieldCheck, ArrowLeft, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { OtpInput } from '@/components/common/OtpInput';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/authSlice';
import { usersService } from '@/features/users/services/users.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';

type Step = 'closed' | 'confirm' | 'otp';

function maskPhone(phone: string): string {
    if (phone.length < 6) return phone;
    return `+995 ${phone[4]}** *** *${phone.slice(-2)}`;
}

export function DeleteAccount(): React.ReactElement {
    const { t } = useLanguage();
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.auth.user);

    const hasVerifiedPhone = Boolean(user?.phone && user?.isPhoneVerified);

    const [step, setStep] = useState<Step>('closed');
    const [confirm, setConfirm] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [requestId, setRequestId] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpKey, setOtpKey] = useState(0);
    const [otpError, setOtpError] = useState<string | null>(null);

    const CONFIRM_WORD = 'DELETE';

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

    const handleConfirmAndSendOtp = useCallback(async (): Promise<void> => {
        if (confirm !== CONFIRM_WORD) return;
        setIsSending(true);
        try {
            const result = await usersService.deleteRequestOtp();
            setRequestId(result.requestId);
            setStep('otp');
            startCooldown();
            setOtpError(null);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSending(false);
        }
    }, [confirm, startCooldown]);

    const handleOtpComplete = useCallback(async (code: string): Promise<void> => {
        setIsDeleting(true);
        setOtpError(null);
        try {
            await usersService.deleteMe(requestId, code);
            dispatch(logout());
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        } catch (error) {
            const msg = getErrorMessage(error);
            setOtpError(msg);
            setIsDeleting(false);
        }
    }, [requestId, dispatch]);

    const handleResend = useCallback(async (): Promise<void> => {
        setIsSending(true);
        setOtpError(null);
        try {
            const result = await usersService.deleteRequestOtp();
            setRequestId(result.requestId);
            setOtpKey((k) => k + 1);
            startCooldown();
            toast.success(t('ui.profile_otp_sent'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSending(false);
        }
    }, [startCooldown, t]);

    const handleBack = useCallback((): void => {
        setStep('confirm');
        setOtpError(null);
    }, []);

    const handleCancel = useCallback((): void => {
        setStep('closed');
        setConfirm('');
        setOtpError(null);
    }, []);

    const maskedPhone = user?.phone ? maskPhone(user.phone) : '';

    return (
        <section className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-center gap-2">
                {step === 'otp' ? (
                    <ShieldCheck size={16} className="text-destructive" />
                ) : (
                    <Warning size={16} className="text-destructive" weight="fill" />
                )}
                <p className="text-sm font-semibold text-destructive">
                    {step === 'otp' ? t('ui.profile_delete_otp_title') : t('ui.profile_delete_account')}
                </p>
            </div>

            {step === 'closed' && (
                <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('ui.profile_delete_warning')}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1.5 cursor-pointer"
                        onClick={() => setStep('confirm')}
                    >
                        <Trash size={14} />
                        {t('ui.profile_delete_btn')}
                    </Button>
                </>
            )}

            {step === 'confirm' && (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('ui.profile_delete_warning')}
                    </p>

                    {!hasVerifiedPhone && (
                        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                            <ShieldCheck size={20} className="text-warning shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                                {t('ui.profile_delete_no_phone')}
                            </p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                            {t('ui.profile_delete_confirm')} <span className="font-mono font-bold text-destructive">{CONFIRM_WORD}</span>
                        </Label>
                        <Input
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder={CONFIRM_WORD}
                            className="border-destructive/40 focus-visible:ring-destructive/30 font-mono"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={confirm !== CONFIRM_WORD || isSending || !hasVerifiedPhone}
                            onClick={handleConfirmAndSendOtp}
                            className="gap-1.5 cursor-pointer"
                        >
                            {isSending && <SpinnerGap size={14} className="animate-spin" />}
                            {isSending ? t('ui.profile_delete_otp_sending') : t('ui.profile_delete_permanently')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="cursor-pointer"
                        >
                            {t('ui.profile_cancel')}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'otp' && (
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        {t('ui.profile_delete_otp_desc')}{' '}
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
                        disabled={isDeleting}
                        digitLabel={t('ui.profile_otp_digit')}
                    />

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            disabled={isDeleting}
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
                                className="gap-1.5 text-destructive hover:text-destructive/80"
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
        </section>
    );
}
