'use client';

import { useMemo } from 'react';
import { SpinnerGap, Phone, Clock, Sparkle, Wallet } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useMyBookings, useUpdateBookingStatus, useMarkDepositReceived } from '../hooks/useMyBookings';
import type { MasterBooking, BookingStatus } from '../types/booking.types';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
}

const STATUS_VARIANT: Record<BookingStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    PENDING: 'secondary',
    CONFIRMED: 'default',
    COMPLETED: 'outline',
    CANCELLED: 'destructive',
    NO_SHOW: 'destructive',
};

export function MasterBookingsBoard(): React.ReactElement {
    const { t } = useLanguage();
    const { bookings, isLoading } = useMyBookings({ page: 1, limit: 50 });

    const groups = useMemo(() => {
        const map = new Map<string, MasterBooking[]>();
        for (const b of bookings) {
            const list = map.get(b.date) ?? [];
            list.push(b);
            map.set(b.date, list);
        }
        return Array.from(map.entries());
    }, [bookings]);

    if (isLoading) {
        return (
            <div className="flex min-h-[30vh] items-center justify-center">
                <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return <EmptyState title={t('booking.empty_title')} description={t('booking.empty_desc')} />;
    }

    return (
        <div className="space-y-6">
            {groups.map(([date, list]) => (
                <div key={date} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground tabular-nums">{formatDate(date)}</h3>
                        <span className="text-xs text-muted-foreground">
                            {t('booking.count_day').replace('{{count}}', String(list.length))}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {list.map((b) => (
                            <BookingRow key={b.id} booking={b} t={t} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function BookingRow({ booking, t }: { booking: MasterBooking; t: (key: string) => string }): React.ReactElement {
    const { updateStatus, isPending } = useUpdateBookingStatus();
    const { markReceived, isPending: isMarking } = useMarkDepositReceived();
    const busy = isPending || isMarking;
    const open = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
    const showPay = booking.paymentMode !== 'NONE' && booking.depositStatus !== 'NONE';

    return (
        <Card className="rounded-xl border-border/50">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{booking.clientName}</span>
                        <Badge variant={STATUS_VARIANT[booking.status]} className="text-[10px]">
                            {t(`booking.status_${booking.status.toLowerCase()}`)}
                        </Badge>
                        {showPay && (
                            <Badge
                                variant={booking.depositStatus === 'RECEIVED' ? 'default' : 'outline'}
                                className="flex items-center gap-1 text-[10px]"
                            >
                                <Wallet size={11} />
                                {t(`booking.pay_${booking.paymentMode.toLowerCase()}`)}
                                {typeof booking.prepaymentAmount === 'number' ? ` ${booking.prepaymentAmount}₾` : ''}
                                {` · ${t(`booking.deposit_${booking.depositStatus.toLowerCase()}`)}`}
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <a href={`tel:${booking.clientPhone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone size={13} /> <span className="tabular-nums">{booking.clientPhone}</span>
                        </a>
                        <span className="flex items-center gap-1 tabular-nums">
                            <Clock size={13} /> {booking.startTime}-{booking.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                            <Sparkle size={13} /> {booking.serviceName}
                        </span>
                    </div>
                </div>

                {open && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                        {booking.depositStatus === 'AWAITING' && (
                            <Button size="sm" variant="default" disabled={busy} onClick={() => markReceived(booking.id)}>
                                {t('booking.action_deposit_received')}
                            </Button>
                        )}
                        {booking.status === 'PENDING' && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus(booking.id, 'CONFIRMED')}>
                                {t('booking.action_confirm')}
                            </Button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                            <Button size="sm" variant="secondary" disabled={busy} onClick={() => updateStatus(booking.id, 'COMPLETED')}>
                                {t('booking.action_complete')}
                            </Button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                            <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateStatus(booking.id, 'NO_SHOW')}>
                                {t('booking.action_no_show')}
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateStatus(booking.id, 'CANCELLED')}>
                            {t('booking.action_cancel')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
