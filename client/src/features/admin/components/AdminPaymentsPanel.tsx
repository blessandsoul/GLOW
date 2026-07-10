'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';
import { getErrorMessage } from '@/lib/utils/error';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

interface RefundRow {
    id: string;
    paymentId: string;
    amountMinor: number;
    status: string;
    failureMessage: string | null;
    createdAt: string;
    payment: { booking: { clientName: string; serviceName: string } };
}

interface PayoutCandidate {
    masterProfileId: string;
    master: { firstName: string; lastName: string; email: string; phone: string | null };
    amountMinor: number;
    entryCount: number;
}

interface PaymentRow {
    id: string;
    status: string;
    amountMinor: number;
    refundedAmountMinor: number;
    currency: string;
    reconciliationRequired: boolean;
    booking: { id: string; status: string; clientName: string; serviceName: string; date: string; masterProfile: { user: { firstName: string; lastName: string } } };
}

interface PayoutRow {
    id: string;
    amountMinor: number;
    status: string;
    transferReference: string | null;
    createdAt: string;
    masterProfile: { user: { firstName: string; lastName: string; email: string } };
    _count: { items: number };
}

const money = (minor: number): string => `${(minor / 100).toFixed(2)} ₾`;

async function fetchPaymentAdminData(): Promise<{
    refunds: RefundRow[];
    candidates: PayoutCandidate[];
    payments: PaymentRow[];
    payouts: PayoutRow[];
}> {
    const [refundResponse, payoutResponse, paymentResponse, payoutsResponse] = await Promise.all([
        apiClient.get<ApiResponse<RefundRow[]>>(API_ENDPOINTS.PAYMENTS.ADMIN_REFUNDS),
        apiClient.get<ApiResponse<PayoutCandidate[]>>(API_ENDPOINTS.PAYMENTS.ADMIN_PAYOUT_CANDIDATES),
        apiClient.get<ApiResponse<PaymentRow[]>>(API_ENDPOINTS.PAYMENTS.ADMIN_PAYMENTS),
        apiClient.get<ApiResponse<PayoutRow[]>>(API_ENDPOINTS.PAYMENTS.ADMIN_PAYOUTS),
    ]);
    return {
        refunds: refundResponse.data.data,
        candidates: payoutResponse.data.data,
        payments: paymentResponse.data.data,
        payouts: payoutsResponse.data.data,
    };
}

export function AdminPaymentsPanel(): React.ReactElement {
    const [refunds, setRefunds] = useState<RefundRow[]>([]);
    const [candidates, setCandidates] = useState<PayoutCandidate[]>([]);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [payouts, setPayouts] = useState<PayoutRow[]>([]);
    const [paymentId, setPaymentId] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('Admin-approved refund');
    const [adjustmentMasterId, setAdjustmentMasterId] = useState('');
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');

    const reload = useCallback(async (): Promise<void> => {
        try {
            const data = await fetchPaymentAdminData();
            setRefunds(data.refunds);
            setCandidates(data.candidates);
            setPayments(data.payments);
            setPayouts(data.payouts);
        } catch (cause) {
            toast.error(getErrorMessage(cause));
        }
    }, []);

    useEffect(() => {
        let active = true;
        void fetchPaymentAdminData()
            .then((data) => {
                if (!active) return;
                setRefunds(data.refunds);
                setCandidates(data.candidates);
                setPayments(data.payments);
                setPayouts(data.payouts);
            })
            .catch((cause: unknown) => toast.error(getErrorMessage(cause)));
        return () => { active = false; };
    }, []);

    async function createRefund(): Promise<void> {
        try {
            await apiClient.post(API_ENDPOINTS.PAYMENTS.ADMIN_CREATE_REFUND(paymentId.trim()), {
                amountMinor: amount ? Math.round(Number(amount) * 100) : undefined,
                reason,
            });
            setPaymentId(''); setAmount('');
            toast.success('Refund initiated');
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    async function createAdjustment(): Promise<void> {
        try {
            await apiClient.post(API_ENDPOINTS.PAYMENTS.ADMIN_CREATE_ADJUSTMENT(adjustmentMasterId.trim()), {
                amountMinor: Math.round(Number(adjustmentAmount) * 100),
                reason: adjustmentReason,
            });
            setAdjustmentAmount(''); setAdjustmentReason('');
            toast.success('Ledger adjustment created');
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    async function refundAction(id: string, action: 'retry' | 'reconcile'): Promise<void> {
        try {
            await apiClient.post(action === 'retry'
                ? API_ENDPOINTS.PAYMENTS.ADMIN_RETRY_REFUND(id)
                : API_ENDPOINTS.PAYMENTS.ADMIN_RECONCILE_REFUND(id));
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    async function reconcilePayment(paymentIdToReconcile: string): Promise<void> {
        try {
            await apiClient.post(API_ENDPOINTS.PAYMENTS.ADMIN_RECONCILE_PAYMENT(paymentIdToReconcile));
            toast.success('Payment reconciled against Flitt');
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    async function createPayout(candidate: PayoutCandidate): Promise<void> {
        try {
            const created = await apiClient.post<ApiResponse<{ id: string }>>(
                API_ENDPOINTS.PAYMENTS.ADMIN_CREATE_PAYOUT(candidate.masterProfileId),
            );
            const reference = window.prompt('Bank transfer reference (required to mark paid):');
            if (reference?.trim()) {
                await apiClient.post(API_ENDPOINTS.PAYMENTS.ADMIN_MARK_PAYOUT_PAID(created.data.data.id), {
                    transferReference: reference.trim(),
                    paidAt: new Date().toISOString(),
                });
                toast.success('Payout marked paid');
            } else {
                toast.success('Payout batch created as draft');
            }
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    async function cancelBooking(bookingId: string): Promise<void> {
        const reason = window.prompt('Cancellation reason:');
        if (!reason?.trim()) return;
        try {
            await apiClient.post(API_ENDPOINTS.PAYMENTS.ADMIN_CANCEL_BOOKING(bookingId), { reason: reason.trim() });
            toast.success('Booking cancelled under the shared policy');
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    async function markPayoutPaid(payoutId: string): Promise<void> {
        const reference = window.prompt('Bank transfer reference:');
        if (!reference?.trim()) return;
        try {
            await apiClient.post(API_ENDPOINTS.PAYMENTS.ADMIN_MARK_PAYOUT_PAID(payoutId), { transferReference: reference.trim(), paidAt: new Date().toISOString() });
            toast.success('Payout marked paid');
            await reload();
        } catch (cause) { toast.error(getErrorMessage(cause)); }
    }

    return (
        <Card>
            <CardHeader>
                <h2 className="text-lg font-semibold">Booking payments, refunds and payouts</h2>
                <p className="text-xs text-muted-foreground">Amounts are server-calculated in minor units. Bank details stay outside Glow.</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Create refund</h3>
                    <div className="grid gap-2 md:grid-cols-4">
                        <Input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="Payment ID" />
                        <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="GEL (blank = remaining)" />
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
                        <Button disabled={!paymentId.trim() || !reason.trim()} onClick={createRefund}>Create refund</Button>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Audited ledger adjustment</h3>
                    <div className="grid gap-2 md:grid-cols-4">
                        <Input value={adjustmentMasterId} onChange={(e) => setAdjustmentMasterId(e.target.value)} placeholder="Master profile ID" />
                        <Input value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} type="number" step="0.01" placeholder="Signed GEL amount" />
                        <Input value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Reason" />
                        <Button disabled={!adjustmentMasterId.trim() || !adjustmentReason.trim() || !Number(adjustmentAmount)} onClick={createAdjustment}>Create adjustment</Button>
                    </div>
                </section>

                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Captured payments</h3>
                    {payments.map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between">
                            <div><p>{payment.booking.clientName} · {payment.booking.serviceName} · {money(payment.amountMinor - payment.refundedAmountMinor)}</p><p className="text-xs text-muted-foreground">{payment.status}{payment.reconciliationRequired ? ' · reconciliation required' : ''} · {payment.id}</p></div>
                            <div className="flex gap-2">
                                {payment.reconciliationRequired && <Button size="sm" variant="outline" onClick={() => reconcilePayment(payment.id)}>Reconcile</Button>}
                                {['PENDING', 'CONFIRMED'].includes(payment.booking.status) && <Button size="sm" variant="destructive" onClick={() => cancelBooking(payment.booking.id)}>Cancel booking</Button>}
                                {['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status) && <Button size="sm" variant="outline" onClick={() => setPaymentId(payment.id)}>Refund</Button>}
                            </div>
                        </div>
                    ))}
                </section>

                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Refund and reconciliation queue</h3>
                    {refunds.length === 0 ? <p className="text-sm text-muted-foreground">No refunds.</p> : refunds.map((refund) => (
                        <div key={refund.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between">
                            <div>
                                <p>{refund.payment.booking.clientName} · {refund.payment.booking.serviceName} · {money(refund.amountMinor)}</p>
                                <p className="text-xs text-muted-foreground">{refund.status}{refund.failureMessage ? ` · ${refund.failureMessage}` : ''} · payment {refund.paymentId}</p>
                            </div>
                            {['FAILED', 'PROCESSING'].includes(refund.status) && <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => refundAction(refund.id, 'reconcile')}>Reconcile</Button>
                                <Button size="sm" onClick={() => refundAction(refund.id, 'retry')}>Retry</Button>
                            </div>}
                        </div>
                    ))}
                </section>

                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Eligible payout balances</h3>
                    {candidates.length === 0 ? <p className="text-sm text-muted-foreground">No positive eligible balances.</p> : candidates.map((candidate) => (
                        <div key={candidate.masterProfileId} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                            <div><p>{candidate.master.firstName} {candidate.master.lastName}</p><p className="text-xs text-muted-foreground">{candidate.master.email} · {candidate.entryCount} ledger entries</p></div>
                            <div className="flex items-center gap-3"><strong>{money(candidate.amountMinor)}</strong><Button size="sm" onClick={() => createPayout(candidate)}>Create payout</Button></div>
                        </div>
                    ))}
                </section>

                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Payout batches</h3>
                    {payouts.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                            <div><p>{payout.masterProfile.user.firstName} {payout.masterProfile.user.lastName} · {money(payout.amountMinor)}</p><p className="text-xs text-muted-foreground">{payout.status} · {payout._count.items} entries{payout.transferReference ? ` · ${payout.transferReference}` : ''}</p></div>
                            {payout.status === 'DRAFT' && <Button size="sm" onClick={() => markPayoutPaid(payout.id)}>Mark paid</Button>}
                        </div>
                    ))}
                </section>
            </CardContent>
        </Card>
    );
}
