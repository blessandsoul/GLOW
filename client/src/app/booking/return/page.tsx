'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SpinnerGap, XCircle, Prohibit } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';

// Flitt redirects the browser here after checkout with the booking id (?b=) and,
// depending on outcome, an order_status / response_status query param. The webhook is
// the source of truth — this page NEVER asserts "confirmed"; it shows a neutral
// pending state (or a distinct fail/cancel message when the outcome is terminal).
type Outcome = 'pending' | 'failed' | 'cancelled';

const FAILURE_STATUSES = new Set(['declined', 'expired', 'reversed', 'error', 'failure']);

function resolveOutcome(params: URLSearchParams): Outcome {
    const orderStatus = (params.get('order_status') ?? '').toLowerCase();
    const responseStatus = (params.get('response_status') ?? '').toLowerCase();

    if (orderStatus === 'cancelled' || orderStatus === 'canceled') return 'cancelled';
    if (FAILURE_STATUSES.has(orderStatus) || responseStatus === 'failure') return 'failed';
    // approved / processing / created / absent → still pending until the webhook confirms.
    return 'pending';
}

function BookingReturnContent(): React.ReactElement {
    const { t } = useLanguage();
    const params = useSearchParams();
    const outcome = resolveOutcome(params);

    const view = {
        pending: {
            icon: <SpinnerGap size={24} className="animate-spin" />,
            iconWrap: 'bg-primary/10 text-primary',
            title: t('booking.return_pending_title'),
            desc: t('booking.return_pending_desc'),
        },
        failed: {
            icon: <XCircle size={24} weight="fill" />,
            iconWrap: 'bg-destructive/10 text-destructive',
            title: t('booking.return_failed_title'),
            desc: t('booking.return_failed_desc'),
        },
        cancelled: {
            icon: <Prohibit size={24} weight="fill" />,
            iconWrap: 'bg-muted text-muted-foreground',
            title: t('booking.return_cancelled_title'),
            desc: t('booking.return_cancelled_desc'),
        },
    }[outcome];

    return (
        <Card className="mx-auto w-full max-w-md rounded-2xl border-border/50 shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div
                    aria-live="polite"
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${view.iconWrap}`}
                >
                    {view.icon}
                </div>
                <h1 className="text-xl font-bold text-foreground">{view.title}</h1>
                <p className="text-sm text-muted-foreground">{view.desc}</p>
                <Button asChild className="mt-2">
                    <Link href={ROUTES.HOME}>{t('booking.return_home')}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function BookingReturnPage(): React.ReactElement {
    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
            <Suspense
                fallback={
                    <div className="flex min-h-[40vh] items-center justify-center">
                        <SpinnerGap size={28} className="animate-spin text-muted-foreground" />
                    </div>
                }
            >
                <BookingReturnContent />
            </Suspense>
        </main>
    );
}
