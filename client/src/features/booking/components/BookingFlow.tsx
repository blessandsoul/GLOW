'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SpinnerGap, CheckCircle, CalendarCheck, Wallet } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { OtpInput } from '@/components/common/OtpInput';
import { JoinWaitlistForm } from '@/features/waitlist/components/JoinWaitlistForm';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import { useBookingInfo, useBookingSlots, useBookingActions } from '../hooks/useBooking';
import { SlotGrid } from './SlotGrid';
import type { RequestOtpPayload, BookResult } from '../types/booking.types';

type Step = 'pick' | 'otp' | 'done';

function startOfToday(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISODate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BookingFlow({ username }: { username: string }): React.ReactElement {
    const { t } = useLanguage();
    const { data: info, isLoading, isError } = useBookingInfo(username);
    const { requestOtp, book, isRequestingOtp, isBooking } = useBookingActions(username);

    const [waitlistMode, setWaitlistMode] = useState(false);
    const [step, setStep] = useState<Step>('pick');
    const [serviceName, setServiceName] = useState('');
    const [day, setDay] = useState<Date | undefined>(undefined);
    const [slot, setSlot] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [consent, setConsent] = useState(false);
    const [formError, setFormError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpRequestId, setOtpRequestId] = useState('');
    const [otpKey, setOtpKey] = useState(0);
    const [result, setResult] = useState<BookResult | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    const isoDate = day ? toISODate(day) : null;
    const { data: slotData, isLoading: slotsLoading } = useBookingSlots(
        username,
        isoDate,
        serviceName || null,
    );

    const selectedService = useMemo(
        () => info?.services.find((s) => s.name === serviceName) ?? null,
        [info, serviceName],
    );

    const payable =
        info?.paymentMode === 'FULL'
            ? selectedService?.price ?? null
            : info?.paymentMode === 'DEPOSIT'
              ? info?.depositAmount ?? null
              : null;

    const emptyLabel = slotData?.dayClosed ? t('booking.day_closed') : t('booking.no_slots');

    function buildPayload(): RequestOtpPayload | null {
        if (!serviceName) return fail('booking.err_service');
        if (!isoDate) return fail('booking.err_date');
        if (!slot) return fail('booking.err_slot');
        if (name.trim().length < 2) return fail('booking.err_name');
        if (!/^\d{9}$/.test(phone)) return fail('booking.err_phone');
        if (!consent) return fail('booking.err_consent');
        return {
            clientName: name.trim(),
            clientPhone: `+995${phone}`,
            date: isoDate,
            startTime: slot,
            serviceName,
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
            setStep('pick');
            return;
        }
        try {
            const res = await book({ ...payload, otpRequestId, code });
            if (res.redirectUrl) {
                setRedirecting(true);
                window.location.href = res.redirectUrl; // hand off to the Flitt checkout page
                return;
            }
            setResult(res);
            setStep('done');
        } catch (e) {
            setOtpError(getErrorMessage(e));
            setOtpKey((k) => k + 1);
        }
    }

    if (waitlistMode) {
        return <JoinWaitlistForm username={username} />;
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <SpinnerGap size={28} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !info) {
        return (
            <Card className="mx-auto w-full max-w-md rounded-2xl border-border/50 shadow-sm">
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">{t('booking.unavailable')}</p>
                    <Button variant="outline" onClick={() => setWaitlistMode(true)}>
                        {t('booking.join_waitlist')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mx-auto w-full max-w-md rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="items-center gap-1 pb-4 pt-8 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CalendarCheck size={24} weight="fill" />
                </div>
                <h1 className="text-xl font-bold text-foreground">{t('booking.title')}</h1>
                <p className="text-sm text-muted-foreground">
                    {t('booking.subtitle').replace('{{name}}', info.masterName)}
                </p>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
                {step === 'done' && result ? (
                    <BookingDone result={result} t={t} />
                ) : step === 'otp' ? (
                    <div className="space-y-6">
                        {otpError && <ErrorBox message={otpError} />}
                        <p className="text-center text-sm text-muted-foreground">{t('booking.otp_desc')}</p>
                        <OtpInput
                            key={otpKey}
                            onComplete={handleOtpComplete}
                            error={otpError || null}
                            disabled={isBooking}
                            digitLabel={t('auth.digit')}
                        />
                        {(isBooking || redirecting) && (
                            <div className="flex flex-col items-center gap-2">
                                <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
                                {redirecting && (
                                    <p className="text-sm text-muted-foreground">{t('booking.redirecting')}</p>
                                )}
                            </div>
                        )}
                        {!redirecting && (
                            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('pick')}>
                                {t('booking.back')}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {formError && <ErrorBox message={formError} />}

                        <div className="space-y-2">
                            <Label htmlFor="bk-service">{t('booking.field_service')}</Label>
                            <Select
                                value={serviceName || undefined}
                                onValueChange={(v) => {
                                    setServiceName(v);
                                    setSlot(null);
                                }}
                            >
                                <SelectTrigger id="bk-service" className="w-full">
                                    <SelectValue placeholder={t('booking.field_service_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {info.services.map((s) => (
                                        <SelectItem key={s.name} value={s.name}>
                                            {s.name}
                                            {` · ${s.durationMinutes}${t('booking.min_suffix')}`}
                                            {typeof s.price === 'number' ? ` · ${s.price}₾` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {serviceName && (
                            <div className="space-y-2">
                                <Label>{t('booking.field_day')}</Label>
                                <div className="flex justify-center rounded-xl border border-border/50 bg-muted/20">
                                    <Calendar
                                        mode="single"
                                        selected={day}
                                        onSelect={(d) => {
                                            setDay(d);
                                            setSlot(null);
                                        }}
                                        disabled={{ before: startOfToday() }}
                                        startMonth={startOfToday()}
                                    />
                                </div>
                            </div>
                        )}

                        {serviceName && day && (
                            <div className="space-y-2">
                                <Label>{t('booking.field_slot')}</Label>
                                <SlotGrid
                                    slots={slotData?.slots ?? []}
                                    selected={slot}
                                    onSelect={setSlot}
                                    isLoading={slotsLoading}
                                    emptyLabel={emptyLabel}
                                />
                                {!slotsLoading && (slotData?.slots.length ?? 0) === 0 && (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto p-0 text-sm"
                                        onClick={() => setWaitlistMode(true)}
                                    >
                                        {t('booking.join_waitlist')}
                                    </Button>
                                )}
                            </div>
                        )}

                        {slot && (
                            <BookingDetails
                                name={name}
                                phone={phone}
                                consent={consent}
                                onName={setName}
                                onPhone={setPhone}
                                onConsent={setConsent}
                                t={t}
                            />
                        )}

                        <Button
                            type="button"
                            onClick={handleRequestOtp}
                            disabled={isRequestingOtp || !slot}
                            className="h-11 w-full rounded-xl font-semibold transition-all active:scale-[0.98]"
                        >
                            {isRequestingOtp ? (
                                <>
                                    <SpinnerGap size={18} className="mr-2 animate-spin" />
                                    {t('booking.sending')}
                                </>
                            ) : slot && payable !== null ? (
                                t('booking.submit_pay').replace('{{amount}}', String(payable))
                            ) : slot ? (
                                t('booking.submit_with_time').replace('{{time}}', slot)
                            ) : (
                                t('booking.submit')
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ErrorBox({ message }: { message: string }): React.ReactElement {
    return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {message}
        </div>
    );
}

interface DetailsProps {
    name: string;
    phone: string;
    consent: boolean;
    onName: (v: string) => void;
    onPhone: (v: string) => void;
    onConsent: (v: boolean) => void;
    t: (key: string) => string;
}

function BookingDetails({ name, phone, consent, onName, onPhone, onConsent, t }: DetailsProps): React.ReactElement {
    return (
        <div className="space-y-5 border-t border-border/50 pt-5">
            <div className="space-y-2">
                <Label htmlFor="bk-name">{t('booking.field_name')}</Label>
                <Input id="bk-name" value={name} onChange={(e) => onName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bk-phone">{t('booking.field_phone')}</Label>
                <div className="flex overflow-hidden rounded-md border border-input">
                    <span className="flex shrink-0 select-none items-center border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                        +995
                    </span>
                    <Input
                        id="bk-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="5XX XXX XXX"
                        maxLength={9}
                        value={phone}
                        onChange={(e) => onPhone(e.target.value.replace(/\D/g, ''))}
                        className="rounded-none border-0 focus-visible:ring-0"
                    />
                </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox checked={consent} onCheckedChange={(v) => onConsent(v === true)} className="mt-0.5" />
                <span>
                    {t('booking.consent')}{' '}
                    <Link href={ROUTES.PRIVACY} className="text-primary underline-offset-2 hover:underline">
                        {t('booking.consent_link')}
                    </Link>
                </span>
            </label>
        </div>
    );
}

function BookingDone({ result, t }: { result: BookResult; t: (key: string) => string }): React.ReactElement {
    return (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={48} weight="fill" className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">{t('booking.success_title')}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
                {result.date} · {result.startTime}-{result.endTime} · {result.serviceName}
            </p>
            {result.prepaymentRequired ? (
                <div className="mt-2 w-full space-y-2 rounded-xl border border-warning/30 bg-warning/5 p-4 text-left">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Wallet size={18} weight="fill" className="text-warning" />
                        {t(result.paymentMode === 'FULL' ? 'booking.full_title' : 'booking.deposit_title').replace(
                            '{{amount}}',
                            String(result.prepaymentAmount ?? ''),
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t(result.paymentMode === 'FULL' ? 'booking.full_desc' : 'booking.deposit_desc')}
                    </p>
                    {result.paymentInfo && (
                        <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                            {result.paymentInfo}
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">{t('booking.success_desc')}</p>
            )}
        </div>
    );
}
