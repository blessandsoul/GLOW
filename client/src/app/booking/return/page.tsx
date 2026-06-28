'use client';

import Link from 'next/link';
import { CalendarCheck } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';

export default function BookingReturnPage(): React.ReactElement {
    const { t } = useLanguage();
    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10">
            <Card className="mx-auto w-full max-w-md rounded-2xl border-border/50 shadow-sm">
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CalendarCheck size={24} weight="fill" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">{t('booking.return_title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('booking.return_desc')}</p>
                    <Button asChild className="mt-2">
                        <Link href={ROUTES.HOME}>{t('booking.return_home')}</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
