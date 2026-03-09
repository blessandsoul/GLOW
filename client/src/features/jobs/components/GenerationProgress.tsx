'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sparkle, Check, WarningCircle, PaperPlaneTilt } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getServerImageUrl } from '@/lib/utils/image';

// ─── Step definitions ────────────────────────────────────────────────────────
const STEP_KEYS = [
    'ui.gen_step_analyzing',
    'ui.gen_step_skin',
    'ui.gen_step_lashes',
    'ui.gen_step_lighting',
    'ui.gen_step_final',
    'ui.gen_step_almost',
] as const;

const STEP_DURATIONS = [5000, 10000, 15000, 20000, 20000, 999999] as const;

// ─── Report Form ─────────────────────────────────────────────────────────────
function ReportForm({ jobId }: { jobId?: string }): React.ReactElement {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const canSubmit = phone.trim().length > 0 && message.trim().length >= 3;

    const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!canSubmit || sending) return;

        setSending(true);
        try {
            await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.REPORT, {
                phone: phone.trim(),
                message: message.trim(),
                ...(jobId ? { jobId } : {}),
            });
            setSent(true);
            toast.success(t('ui.gen_report_success'));
        } catch {
            toast.error(t('ui.gen_report_error'));
        } finally {
            setSending(false);
        }
    }, [canSubmit, phone, message, sending, jobId, t]);

    if (sent) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
                <Check size={16} weight="bold" className="text-success shrink-0" />
                <p className="text-xs font-medium text-success">{t('ui.gen_report_success')}</p>
            </div>
        );
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.98]"
            >
                <WarningCircle size={14} />
                {t('ui.gen_report_btn')}
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-2">
            <p className="text-xs font-medium text-foreground">{t('ui.gen_report_title')}</p>
            <p className="text-[11px] text-muted-foreground">{t('ui.gen_report_desc')}</p>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('ui.gen_report_message')}
                rows={3}
                className={cn(
                    'w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
                    'transition-all duration-200',
                )}
                autoFocus
            />
            <div className="flex gap-2">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('ui.gen_report_phone')}
                    className={cn(
                        'h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs',
                        'placeholder:text-muted-foreground/60',
                        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
                        'transition-all duration-200',
                    )}
                />
                <button
                    type="submit"
                    disabled={!canSubmit || sending}
                    className={cn(
                        'flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground',
                        'transition-all duration-200 active:scale-[0.97]',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'hover:bg-primary/90',
                    )}
                >
                    <PaperPlaneTilt size={13} weight="bold" />
                    {sending ? t('ui.gen_report_sending') : t('ui.gen_report_send')}
                </button>
            </div>
        </form>
    );
}

// ─── Animated steps indicator ────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
                {STEP_KEYS.slice(0, 5).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-500 ease-out',
                            i < currentStep
                                ? 'w-6 bg-primary'
                                : i === currentStep
                                    ? 'w-6 bg-primary/60 animate-pulse'
                                    : 'w-1.5 bg-muted-foreground/20',
                        )}
                    />
                ))}
            </div>

            {/* Step text with fade animation */}
            <div className="relative h-5 w-full overflow-hidden">
                {STEP_KEYS.map((key, i) => (
                    <p
                        key={key}
                        className={cn(
                            'absolute inset-0 text-center text-xs font-medium transition-all duration-500',
                            i === currentStep
                                ? 'translate-y-0 opacity-100 text-foreground'
                                : i < currentStep
                                    ? '-translate-y-4 opacity-0 text-foreground'
                                    : 'translate-y-4 opacity-0 text-muted-foreground',
                        )}
                    >
                        {t(key)}
                    </p>
                ))}
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface GenerationProgressProps {
    originalUrl?: string;
    jobId?: string;
}

export function GenerationProgress({ originalUrl, jobId }: GenerationProgressProps): React.ReactElement {
    const [currentStep, setCurrentStep] = useState(0);
    const [blurAmount, setBlurAmount] = useState(20);

    // Advance steps progressively
    useEffect(() => {
        let elapsed = 0;
        const timers: NodeJS.Timeout[] = [];

        for (let i = 0; i < STEP_KEYS.length - 1; i++) {
            elapsed += STEP_DURATIONS[i];
            const step = i + 1;
            timers.push(setTimeout(() => setCurrentStep(step), elapsed));
        }

        return () => timers.forEach(clearTimeout);
    }, []);

    // Decrease blur over time (20px → 4px over ~60s)
    useEffect(() => {
        const interval = setInterval(() => {
            setBlurAmount((prev) => Math.max(4, prev - 0.3));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex w-full flex-col items-center gap-6 py-6">
            {/* Sparkle icon with glow */}
            <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkle size={24} weight="fill" className="animate-pulse text-primary" />
                </div>
                <div className="absolute -inset-2 -z-10 rounded-2xl bg-primary/5 blur-xl" />
            </div>

            {/* Step indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Blur-reveal image preview */}
            {originalUrl && (
                <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-border/40">
                    <div className="relative aspect-3/4">
                        <Image
                            src={getServerImageUrl(originalUrl)}
                            alt=""
                            fill
                            className="object-cover transition-[filter] duration-1000 ease-out"
                            style={{ filter: `blur(${blurAmount}px) saturate(1.2)` }}
                            sizes="(max-width: 640px) 80vw, 320px"
                            unoptimized
                        />
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>

                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
            )}

            {/* Fallback skeleton when no originalUrl */}
            {!originalUrl && (
                <div className="w-full max-w-xs">
                    <div className="aspect-3/4 w-full animate-pulse rounded-2xl bg-muted" />
                </div>
            )}

            {/* Report button */}
            <ReportForm jobId={jobId} />
        </div>
    );
}
