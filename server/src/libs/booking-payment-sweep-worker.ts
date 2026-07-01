import { Queue, Worker } from 'bullmq';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { prisma } from '@/libs/prisma.js';

// Parse REDIS_URL into connection options for BullMQ (same shape as the other workers).
function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string; username?: string } {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: url.port ? parseInt(url.port, 10) : 6379,
      ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
      ...(url.username && url.username !== 'default' ? { username: url.username } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = parseRedisUrl(env.REDIS_URL);

/**
 * Sweep bookings stuck on an unpaid checkout and release their slot.
 *
 * DESTRUCTIVE (autonomous): for every PENDING Payment older than its provider-specific
 * window whose booking is still `PENDING`, it transitions Payment -> FAILED and
 * Booking -> CANCELLED (the same transactional pair the verified Flitt callback uses on
 * a declined/expired payment).
 *
 * PROVIDER-AWARE AGE WINDOW (why the two provider paths differ only in threshold):
 *  - provider='flitt': an on-platform Flitt hosted checkout. Aged out at
 *    BOOKING_PAYMENT_TIMEOUT_MIN (~45 min ≈ the Flitt order lifetime) — the client
 *    abandoned the payment page and Flitt never sent a terminal callback.
 *  - provider='offline': an OFF-PLATFORM prepay booking the master manages manually
 *    (deposit/full paid directly to the master). Aged out at the much longer
 *    OFFLINE_PAYMENT_TIMEOUT_MIN (default 1440 = 24h) so a booking merely awaiting the
 *    master's manual confirmation is NEVER auto-cancelled at the 45-min Flitt window.
 *  Both paths perform the IDENTICAL terminal transition; only the cutoff differs.
 *
 * SAFETY / SCOPE (why this cannot cancel a paid booking):
 *  - It only touches bookings that HAVE a Payment row.
 *  - It requires Payment.status = 'PENDING'. A PAID payment (booking already CONFIRMED)
 *    or an already-FAILED one is excluded, so it never re-cancels or touches a confirmed
 *    booking.
 *  - It requires Booking.status = 'PENDING'. A CONFIRMED / CANCELLED / COMPLETED booking
 *    is excluded even if a stray PENDING payment lingered.
 *  - The window is measured from Payment.createdAt (the moment the order/prepay was issued).
 *  - Idempotent: after a run the swept payments are FAILED, so a re-run finds nothing.
 *
 * NOTE (payment path): the Flitt integration is UNVERIFIED against a live gateway
 * (live-test deferred by the user). This sweep is the safety net for the case where a
 * client abandons the hosted checkout and Flitt never sends a terminal callback.
 */
async function sweepStalePendingBookingPayments(now: Date): Promise<number> {
  const flittCutoff = new Date(now.getTime() - env.BOOKING_PAYMENT_TIMEOUT_MIN * 60_000);
  const offlineCutoff = new Date(now.getTime() - env.OFFLINE_PAYMENT_TIMEOUT_MIN * 60_000);

  const stale = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      booking: { status: 'PENDING' },
      // Provider-aware age: flitt payments age out fast, offline (master-managed)
      // payments only after the much longer offline window.
      OR: [
        { provider: 'flitt', createdAt: { lt: flittCutoff } },
        { provider: 'offline', createdAt: { lt: offlineCutoff } },
      ],
    },
    select: { id: true, bookingId: true },
  });

  let released = 0;
  for (const payment of stale) {
    try {
      // Re-assert PENDING inside each update's WHERE so a callback that lands mid-sweep
      // (marking the payment PAID + booking CONFIRMED) is never clobbered: updateMany
      // with a status guard matches 0 rows if the state already advanced.
      const result = await prisma.$transaction([
        prisma.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: { status: 'FAILED' },
        }),
        prisma.booking.updateMany({
          where: { id: payment.bookingId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        }),
      ]);
      if (result[0].count > 0) {
        released += 1;
        logger.info(
          { paymentId: payment.id, bookingId: payment.bookingId },
          'Stale unpaid booking swept: payment FAILED, booking CANCELLED',
        );
      }
    } catch (err) {
      logger.error({ paymentId: payment.id, bookingId: payment.bookingId, err }, 'Failed to sweep stale booking payment');
    }
  }
  return released;
}

export const bookingPaymentSweepQueue = new Queue<Record<string, never>, void, string>(
  'booking-payment-sweep',
  { connection },
);

export const bookingPaymentSweepWorker = new Worker<Record<string, never>, void, string>(
  'booking-payment-sweep',
  async () => {
    const released = await sweepStalePendingBookingPayments(new Date());
    if (released > 0) logger.info({ released }, 'Stale booking-payment sweep completed');
  },
  { connection },
);

bookingPaymentSweepWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Booking payment sweep job failed');
});

export async function startBookingPaymentSweepSchedule(): Promise<void> {
  await bookingPaymentSweepQueue.add(
    'sweep-stale',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // hourly
      removeOnComplete: true,
      removeOnFail: 5,
    },
  );
  logger.info('Booking payment sweep schedule registered (hourly)');
}

// Exported for unit tests (pure of BullMQ; drives real prisma).
export const _internal = { sweepStalePendingBookingPayments };
