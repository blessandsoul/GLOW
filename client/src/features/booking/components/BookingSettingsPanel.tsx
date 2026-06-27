'use client';

import { useEffect, useState } from 'react';
import { SpinnerGap, FloppyDisk } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useBookingSettings } from '../hooks/useBookingSettings';
import { WorkingHoursEditor } from './WorkingHoursEditor';
import { ServiceDurations } from './ServiceDurations';
import type { WorkingHours, ProfileServiceItem } from '../types/booking.types';

function defaultWorkingHours(): WorkingHours {
    const day = [{ open: '10:00', close: '19:00' }];
    return {
        monday: day,
        tuesday: day,
        wednesday: day,
        thursday: day,
        friday: day,
        saturday: day,
        sunday: null,
    };
}

export function BookingSettingsPanel(): React.ReactElement {
    const { t } = useLanguage();
    const { settings, isLoading, save, isSaving } = useBookingSettings();

    const [enabled, setEnabled] = useState(false);
    const [prepayEnabled, setPrepayEnabled] = useState(false);
    const [amount, setAmount] = useState(20);
    const [paymentInfo, setPaymentInfo] = useState('');
    const [hours, setHours] = useState<WorkingHours>(defaultWorkingHours);
    const [services, setServices] = useState<ProfileServiceItem[]>([]);

    useEffect(() => {
        if (!settings) return;
        setEnabled(settings.bookingEnabled);
        setPrepayEnabled(settings.bookingPrepaymentEnabled);
        setAmount(settings.bookingPrepaymentAmount ?? 20);
        setPaymentInfo(settings.bookingPaymentInfo ?? '');
        setHours(settings.workingHours ?? defaultWorkingHours());
        setServices(settings.services ?? []);
    }, [settings]);

    async function handleSave(): Promise<void> {
        await save({
            bookingEnabled: enabled,
            bookingPrepaymentEnabled: prepayEnabled,
            bookingPrepaymentAmount: amount,
            bookingPaymentInfo: paymentInfo.trim() ? paymentInfo.trim() : null,
            workingHours: hours,
            services,
        });
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[30vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-xl border-border/50">
                <CardContent className="space-y-4 p-5">
                    <ToggleRow
                        label={t('booking.setting_enabled')}
                        hint={t('booking.setting_enabled_hint')}
                        checked={enabled}
                        onChange={setEnabled}
                    />
                </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
                <CardHeader className="pb-0">
                    <h3 className="text-sm font-semibold text-foreground">{t('booking.setting_hours')}</h3>
                    <p className="text-xs text-muted-foreground">{t('booking.setting_hours_hint')}</p>
                </CardHeader>
                <CardContent className="p-5">
                    <WorkingHoursEditor value={hours} onChange={setHours} t={t} />
                </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
                <CardHeader className="pb-0">
                    <h3 className="text-sm font-semibold text-foreground">{t('booking.setting_durations')}</h3>
                    <p className="text-xs text-muted-foreground">{t('booking.setting_durations_hint')}</p>
                </CardHeader>
                <CardContent className="p-5">
                    <ServiceDurations services={services} onChange={setServices} t={t} />
                </CardContent>
            </Card>

            <Card className="rounded-xl border-border/50">
                <CardContent className="space-y-4 p-5">
                    <ToggleRow
                        label={t('booking.setting_deposit')}
                        hint={t('booking.setting_deposit_hint')}
                        checked={prepayEnabled}
                        onChange={setPrepayEnabled}
                    />
                    {prepayEnabled && (
                        <div className="space-y-4 border-t border-border/50 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="bk-amount">{t('booking.setting_amount')}</Label>
                                <div className="flex w-40 items-center gap-2">
                                    <Input
                                        id="bk-amount"
                                        type="number"
                                        min={0}
                                        max={100000}
                                        value={amount}
                                        onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                                        className="tabular-nums"
                                    />
                                    <span className="text-sm text-muted-foreground">₾</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bk-payinfo">{t('booking.setting_payment_info')}</Label>
                                <Textarea
                                    id="bk-payinfo"
                                    value={paymentInfo}
                                    onChange={(e) => setPaymentInfo(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder={t('booking.setting_payment_info_ph')}
                                />
                                <p className="text-xs text-muted-foreground">{t('booking.setting_payment_info_note')}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="h-11 w-full rounded-xl font-semibold transition-all active:scale-[0.98] sm:w-auto sm:px-8"
            >
                {isSaving ? (
                    <>
                        <SpinnerGap size={18} className="mr-2 animate-spin" />
                        {t('booking.saving')}
                    </>
                ) : (
                    <>
                        <FloppyDisk size={18} className="mr-2" />
                        {t('booking.save')}
                    </>
                )}
            </Button>
        </div>
    );
}

interface ToggleRowProps {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps): React.ReactElement {
    return (
        <label className="flex items-start justify-between gap-4">
            <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
            <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
        </label>
    );
}
