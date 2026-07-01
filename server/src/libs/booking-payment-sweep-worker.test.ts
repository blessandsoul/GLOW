import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub BullMQ so importing the module doesn't open a real Redis connection
// (new Queue/new Worker run at module load). We only test the sweep query/transition logic.
vi.mock('bullmq', () => ({
  Queue: class {
    add = vi.fn();
  },
  Worker: class {
    on = vi.fn();
    close = vi.fn();
  },
}));

vi.mock('./logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// Hoisted so the vi.mock factory (also hoisted) can reference these safely.
const { findMany, paymentUpdateMany, bookingUpdateMany, $transaction } = vi.hoisted(() => ({
  findMany: vi.fn(),
  paymentUpdateMany: vi.fn(),
  bookingUpdateMany: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock('./prisma.js', () => ({
  prisma: {
    payment: { findMany, updateMany: paymentUpdateMany },
    booking: { updateMany: bookingUpdateMany },
    $transaction,
  },
}));

import { _internal } from './booking-payment-sweep-worker.js';

const { sweepStalePendingBookingPayments } = _internal;
const NOW = new Date('2026-07-01T12:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction runs the array of prisma ops and returns their results.
  $transaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
});

describe('sweepStalePendingBookingPayments', () => {
  it('queries only PENDING payments whose booking is still PENDING, with provider-aware age windows', async () => {
    findMany.mockResolvedValue([]);

    await sweepStalePendingBookingPayments(NOW);

    expect(findMany).toHaveBeenCalledTimes(1);
    const arg = findMany.mock.calls[0][0];
    expect(arg.where.status).toBe('PENDING');
    expect(arg.where.booking).toEqual({ status: 'PENDING' });
    // Provider-aware: flitt ages out at BOOKING_PAYMENT_TIMEOUT_MIN (default 45 min),
    // offline (master-managed) at the much longer OFFLINE_PAYMENT_TIMEOUT_MIN (default 1440 = 24h).
    expect(arg.where.OR).toEqual([
      { provider: 'flitt', createdAt: { lt: new Date(NOW.getTime() - 45 * 60_000) } },
      { provider: 'offline', createdAt: { lt: new Date(NOW.getTime() - 1440 * 60_000) } },
    ]);
  });

  it('the offline window is much longer than the flitt window (does not age out master-managed prepay at 45 min)', async () => {
    findMany.mockResolvedValue([]);

    await sweepStalePendingBookingPayments(NOW);

    const arg = findMany.mock.calls[0][0];
    const flitt = arg.where.OR.find((c: { provider: string }) => c.provider === 'flitt');
    const offline = arg.where.OR.find((c: { provider: string }) => c.provider === 'offline');
    // offline cutoff is further in the past (older) → requires a much greater age.
    expect(offline.createdAt.lt.getTime()).toBeLessThan(flitt.createdAt.lt.getTime());
  });

  it('fails the payment and cancels the booking for each stale row, guarding on PENDING', async () => {
    findMany.mockResolvedValue([
      { id: 'pay-1', bookingId: 'book-1' },
      { id: 'pay-2', bookingId: 'book-2' },
    ]);
    // Each updateMany reports one row changed.
    paymentUpdateMany.mockResolvedValue({ count: 1 });
    bookingUpdateMany.mockResolvedValue({ count: 1 });

    const released = await sweepStalePendingBookingPayments(NOW);

    expect(released).toBe(2);
    // Payment guarded on status PENDING → FAILED
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 'pay-1', status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    // Booking guarded on status PENDING → CANCELLED (never touches CONFIRMED)
    expect(bookingUpdateMany).toHaveBeenCalledWith({
      where: { id: 'book-1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
  });

  it('does NOT count a row whose payment advanced mid-sweep (updateMany matched 0)', async () => {
    findMany.mockResolvedValue([{ id: 'pay-1', bookingId: 'book-1' }]);
    // A callback landed first: the payment is no longer PENDING, so the guarded update
    // matches nothing.
    paymentUpdateMany.mockResolvedValue({ count: 0 });
    bookingUpdateMany.mockResolvedValue({ count: 0 });

    const released = await sweepStalePendingBookingPayments(NOW);

    expect(released).toBe(0);
  });

  it('continues past a per-row failure and still processes the rest', async () => {
    findMany.mockResolvedValue([
      { id: 'pay-1', bookingId: 'book-1' },
      { id: 'pay-2', bookingId: 'book-2' },
    ]);
    $transaction
      .mockRejectedValueOnce(new Error('db blip'))
      .mockImplementationOnce(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
    paymentUpdateMany.mockResolvedValue({ count: 1 });
    bookingUpdateMany.mockResolvedValue({ count: 1 });

    const released = await sweepStalePendingBookingPayments(NOW);

    // pay-1 threw, pay-2 succeeded.
    expect(released).toBe(1);
  });

  it('does nothing when there are no stale payments', async () => {
    findMany.mockResolvedValue([]);
    const released = await sweepStalePendingBookingPayments(NOW);
    expect(released).toBe(0);
    expect($transaction).not.toHaveBeenCalled();
  });
});
