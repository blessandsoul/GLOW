'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { bookingService } from '../services/booking.service';
import type { MasterPaymentBalance } from '../types/booking.types';

const formatMoney = (minor: number): string => `${(minor / 100).toFixed(2)} ₾`;

export function MasterPaymentBalanceCard(): React.ReactElement | null {
    const [balance, setBalance] = useState<MasterPaymentBalance | null>(null);

    useEffect(() => {
        bookingService.getPaymentBalance().then(setBalance).catch(() => setBalance(null));
    }, []);

    if (!balance) return null;
    return (
        <Card className="mb-6 border-border/50">
            <CardHeader><h2 className="text-sm font-semibold">ონლაინ ჯავშნების თანხები</h2></CardHeader>
            <CardContent className="space-y-4">
                <dl className="grid grid-cols-3 gap-3 text-sm">
                    <div><dt className="text-muted-foreground">მოლოდინში</dt><dd className="font-semibold tabular-nums">{formatMoney(balance.pendingMinor)}</dd></div>
                    <div><dt className="text-muted-foreground">ხელმისაწვდომი</dt><dd className="font-semibold tabular-nums">{formatMoney(balance.availableMinor)}</dd></div>
                    <div><dt className="text-muted-foreground">გადახდილი</dt><dd className="font-semibold tabular-nums">{formatMoney(balance.paidMinor)}</dd></div>
                </dl>
                {balance.payouts.length > 0 && (
                    <div className="space-y-2 border-t pt-3 text-xs">
                        {balance.payouts.slice(0, 5).map((payout) => (
                            <div key={payout.id} className="flex justify-between gap-3">
                                <span>{new Date(payout.createdAt).toLocaleDateString('ka-GE')} · {payout.status}</span>
                                <span className="tabular-nums">{formatMoney(payout.amountMinor)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
