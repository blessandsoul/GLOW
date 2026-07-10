'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { bookingService } from '@/features/booking/services/booking.service';
import type { ManagedBooking } from '@/features/booking/types/booking.types';
import { getErrorMessage } from '@/lib/utils/error';

const money = (minor: number, currency: string): string =>
    new Intl.NumberFormat('ka-GE', { style: 'currency', currency }).format(minor / 100);

export default function ManageBookingPage(): React.ReactElement {
    const { token } = useParams<{ token: string }>();
    const [booking, setBooking] = useState<ManagedBooking | null>(null);
    const [reason, setReason] = useState('გეგმები შეიცვალა');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        bookingService.getManagedBooking(token)
            .then(setBooking)
            .catch((cause: unknown) => setError(getErrorMessage(cause)))
            .finally(() => setLoading(false));
    }, [token]);

    async function cancel(): Promise<void> {
        if (!booking || !window.confirm(`დადასტურება: დაბრუნდება ${money(booking.refundAmountMinor, booking.currency)}.`)) return;
        setCancelling(true);
        setError(null);
        try {
            const cancellation = await bookingService.cancelManagedBooking(token, reason.trim() || 'Client cancellation');
            const refund = money(cancellation.refundAmountMinor, booking.currency);
            if (cancellation.refundStatus === 'SUCCEEDED') {
                setResult(`ჯავშანი გაუქმდა. დაბრუნებულია ${refund}.`);
            } else if (cancellation.refundStatus === 'PROCESSING') {
                setResult(`ჯავშანი გაუქმდა. ${refund}-ის დაბრუნება მუშავდება და მოწმდება.`);
            } else if (cancellation.refundStatus === 'FAILED') {
                setResult(`ჯავშანი გაუქმდა. ${refund}-ის დაბრუნება ჯერ არ შესრულებულა; მოთხოვნა გადაცემულია მხარდაჭერის რიგში.`);
            } else {
                setResult('ჯავშანი გაუქმდა. პოლიტიკის მიხედვით დაბრუნება საჭირო არ არის.');
            }
            setBooking({ ...booking, status: 'CANCELLED' });
        } catch (cause) {
            setError(getErrorMessage(cause));
        } finally {
            setCancelling(false);
        }
    }

    if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><SpinnerGap className="animate-spin" size={28} /></div>;

    return (
        <main className="mx-auto max-w-xl px-4 py-12">
            <Card>
                <CardHeader>
                    <h1 className="text-xl font-semibold">ჯავშნის მართვა</h1>
                    <p className="text-sm text-muted-foreground">გაუქმებამდე ხედავთ ზუსტ დასაბრუნებელ თანხას.</p>
                </CardHeader>
                <CardContent className="space-y-5">
                    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                    {result && <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700">{result}</p>}
                    {booking && (
                        <>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <dt className="text-muted-foreground">სერვისი</dt><dd>{booking.serviceName}</dd>
                                <dt className="text-muted-foreground">თარიღი</dt><dd>{new Date(booking.date).toLocaleDateString('ka-GE')}</dd>
                                <dt className="text-muted-foreground">დრო</dt><dd>{booking.startTime}–{booking.endTime}</dd>
                                <dt className="text-muted-foreground">სრული დაბრუნების ბოლო ვადა</dt><dd>{new Date(booking.cancellationDeadline).toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}</dd>
                                <dt className="text-muted-foreground">დასაბრუნებელი</dt><dd className="font-semibold">{money(booking.refundAmountMinor, booking.currency)}</dd>
                                <dt className="text-muted-foreground">დაკავებული</dt><dd>{money(booking.retainedAmountMinor, booking.currency)}</dd>
                            </dl>
                            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                                24 საათით ადრე გაუქმებისას თანხა სრულად ბრუნდება. უფრო გვიან გაუქმებისას ან გამოუცხადებლობისას Glow ინარჩუნებს მხოლოდ ჯავშნისას დაფიქსირებულ დეპოზიტს.
                            </p>
                            {booking.status !== 'CANCELLED' && (
                                <div className="space-y-3">
                                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} aria-label="გაუქმების მიზეზი" />
                                    <Button variant="destructive" className="w-full" disabled={cancelling} onClick={cancel}>
                                        {cancelling ? <SpinnerGap className="mr-2 animate-spin" /> : null} ჯავშნის გაუქმება
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
