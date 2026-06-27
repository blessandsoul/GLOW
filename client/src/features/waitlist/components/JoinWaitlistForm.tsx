'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SpinnerGap, CheckCircle, CalendarHeart } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { OtpInput } from '@/components/common/OtpInput';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import { useWaitlistServices, useJoinWaitlist } from '../hooks/useJoinWaitlist';
import type { RequestOtpPayload } from '../types/waitlist.types';

type Step = 'form' | 'otp' | 'done';

function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function JoinWaitlistForm({ username }: { username: string }): React.ReactElement {
    const { t } = useLanguage();
    const { data: master, isLoading, isError } = useWaitlistServices(username);
    const { requestOtp, join, isRequestingOtp, isJoining } = useJoinWaitlist(username);

    const [step, setStep] = useState<Step>('form');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [time, setTime] = useState('');
    const [consent, setConsent] = useState(false);
    const [formError, setFormError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpRequestId, setOtpRequestId] = useState('');
    const [otpKey, setOtpKey] = useState(0);

    const services = master?.services ?? [];

    function buildPayload(): RequestOtpPayload | null {
        if (name.trim().length < 2) return fail('waitlist.err_name');
        if (!/^\d{9}$/.test(phone)) return fail('waitlist.err_phone');
        if (!date) return fail('waitlist.err_date');
        if (services.length > 0 && !serviceName) return fail('waitlist.err_service');
        if (!consent) return fail('waitlist.err_consent');
        return {
            clientName: name.trim(),
            clientPhone: `+995${phone}`,
            requestedDate: date,
            ...(serviceName ? { serviceName } : {}),
            ...(time ? { preferredTime: time } : {}),
            consent: true,
        };
    }

    function fail(key: string): null {
        setFormError(t(key));
        return null;
    }

    async function handleRequestOtp(): Promise<void> {
        setFormError('');
        const payload = buildPayload();
        if (!payload) return;
        try {
            const { requestId } = await requestOtp(payload);
            setOtpRequestId(requestId);
            setStep('otp');
        } catch (e) {
            setFormError(getErrorMessage(e));
        }
    }

    async function handleOtpComplete(code: string): Promise<void> {
        setOtpError('');
        const payload = buildPayload();
        if (!payload) {
            setStep('form');
            return;
        }
        try {
            await join({ ...payload, otpRequestId, code });
            setStep('done');
        } catch (e) {
            setOtpError(getErrorMessage(e));
            setOtpKey((k) => k + 1);
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <SpinnerGap size={28} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !master) {
        return (
            <Card className="mx-auto max-w-md">
                <CardContent className="py-12 text-center text-muted-foreground">
                    {t('waitlist.master_not_found')}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mx-auto w-full max-w-md rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="items-center gap-1 pb-4 pt-8 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CalendarHeart size={24} weight="fill" />
                </div>
                <h1 className="text-xl font-bold text-foreground">{t('waitlist.join_title')}</h1>
                <p className="text-sm text-muted-foreground">
                    {t('waitlist.join_subtitle').replace('{{name}}', master.masterName)}
                </p>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
                {step === 'done' ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <CheckCircle size={48} weight="fill" className="text-success" />
                        <h2 className="text-lg font-semibold text-foreground">{t('waitlist.success_title')}</h2>
                        <p className="text-sm text-muted-foreground">{t('waitlist.success_desc')}</p>
                    </div>
                ) : step === 'otp' ? (
                    <div className="space-y-6">
                        {otpError && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                {otpError}
                            </div>
                        )}
                        <p className="text-center text-sm text-muted-foreground">{t('waitlist.otp_desc')}</p>
                        <OtpInput
                            key={otpKey}
                            onComplete={handleOtpComplete}
                            error={otpError || null}
                            disabled={isJoining}
                            digitLabel={t('auth.digit')}
                        />
                        {isJoining && (
                            <div className="flex justify-center">
                                <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
                            </div>
                        )}
                        <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('form')}>
                            {t('waitlist.back')}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {formError && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                {formError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="wl-name">{t('waitlist.field_name')}</Label>
                            <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="wl-phone">{t('waitlist.field_phone')}</Label>
                            <div className="flex overflow-hidden rounded-md border border-input">
                                <span className="flex shrink-0 select-none items-center border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                                    +995
                                </span>
                                <Input
                                    id="wl-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="5XX XXX XXX"
                                    maxLength={9}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="rounded-none border-0 focus-visible:ring-0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="wl-date">{t('waitlist.field_date')}</Label>
                                <Input id="wl-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wl-time">{t('waitlist.field_time')}</Label>
                                <Input id="wl-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                            </div>
                        </div>

                        {services.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="wl-service">{t('waitlist.field_service')}</Label>
                                <Select value={serviceName || undefined} onValueChange={setServiceName}>
                                    <SelectTrigger id="wl-service" className="w-full">
                                        <SelectValue placeholder={t('waitlist.field_service_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map((s) => (
                                            <SelectItem key={s.name} value={s.name}>
                                                {s.name}
                                                {typeof s.price === 'number' ? ` · ${s.price}₾` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <label className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Checkbox
                                checked={consent}
                                onCheckedChange={(v) => setConsent(v === true)}
                                className="mt-0.5"
                            />
                            <span>
                                {t('waitlist.consent')}{' '}
                                <Link href={ROUTES.PRIVACY} className="text-primary underline-offset-2 hover:underline">
                                    {t('waitlist.consent_link')}
                                </Link>
                            </span>
                        </label>

                        <Button
                            type="button"
                            onClick={handleRequestOtp}
                            disabled={isRequestingOtp}
                            className="h-11 w-full rounded-xl font-semibold transition-all active:scale-[0.98]"
                        >
                            {isRequestingOtp ? (
                                <>
                                    <SpinnerGap size={18} className="mr-2 animate-spin" />
                                    {t('waitlist.sending')}
                                </>
                            ) : (
                                t('waitlist.submit')
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
