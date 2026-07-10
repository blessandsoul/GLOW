import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/errors.js';
import { sendOtp, verifyOtp, sendSms } from '@/libs/otp.js';
import {
  createFlittCheckout,
  isFlittConfigured,
  verifyFlittCallback,
  isFlittApproved,
  isFlittTerminalFailure,
} from '@/libs/flitt.js';
import { tbilisiNow } from '@/shared/time/tbilisi.js';
import { assertOtpPhoneAllowed } from '@/shared/rate-limit/otp-throttle.js';
import { bookingRepo } from './booking.repo.js';
import { createBookingManageToken, hashBookingManageToken } from '@/modules/payments/manage-token.js';
import { paymentsService } from '@/modules/payments/payments.instance.js';
import { recordGatewayReversal } from '@/modules/payments/payments.repo.js';
import { BOOKING_STATUSES, type BookingStatus } from './booking.schemas.js';
import type { BookInput, MasterListQueryInput, RequestOtpInput } from './booking.schemas.js';

// "HH:MM" working hours are local Tbilisi wall-clock time (see @/shared/time/tbilisi).
const DEFAULT_DURATION = 60;

type WeekdayKey =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const WEEKDAYS: WeekdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface ServiceOption {
  name: string;
  durationMinutes: number;
  price?: number;
}

// Legal master-driven status transitions. Terminal states (CANCELLED/COMPLETED/NO_SHOW)
// have NO outgoing edges — once there, the booking is frozen. PENDING may confirm/cancel/
// no-show; a CONFIRMED booking may complete/cancel/no-show. A master never sets PENDING.
// (The payment callback drives PENDING→CONFIRMED / PENDING→CANCELLED on its own path.)
const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

function isBookingStatus(s: string): s is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(s);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function mapServices(services: unknown): ServiceOption[] {
  if (!Array.isArray(services)) return [];
  return services.flatMap((s): ServiceOption[] => {
    if (!s || typeof s !== 'object') return [];
    const obj = s as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name : null;
    if (!name) return [];
    const duration = typeof obj.duration === 'number' && obj.duration >= 5 ? obj.duration : DEFAULT_DURATION;
    return [{ name, durationMinutes: duration, ...(typeof obj.price === 'number' ? { price: obj.price } : {}) }];
  });
}

type DayInterval = { open: string; close: string };

function dayIntervals(workingHours: unknown, key: WeekdayKey): DayInterval[] {
  if (!workingHours || typeof workingHours !== 'object') return [];
  const day = (workingHours as Record<string, unknown>)[key];
  if (!Array.isArray(day)) return [];
  return day.flatMap((iv): DayInterval[] => {
    if (!iv || typeof iv !== 'object') return [];
    const o = iv as Record<string, unknown>;
    return typeof o.open === 'string' && typeof o.close === 'string'
      ? [{ open: o.open, close: o.close }]
      : [];
  });
}

/**
 * Pure slot generator (unit-tested). Steps each working interval by the service
 * duration, drops candidates that overflow the interval, overlap a busy range,
 * or are already past (when the day is today in Tbilisi).
 */
export function computeSlots(opts: {
  intervals: DayInterval[];
  durationMinutes: number;
  busy: { startTime: string; endTime: string }[];
  isToday: boolean;
  nowMinutes: number;
}): string[] {
  const { intervals, durationMinutes, busy, isToday, nowMinutes } = opts;
  const busyRanges = busy.map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)] as const);
  const slots: string[] = [];

  for (const iv of intervals) {
    const open = toMinutes(iv.open);
    const close = toMinutes(iv.close);
    for (let start = open; start + durationMinutes <= close; start += durationMinutes) {
      const end = start + durationMinutes;
      if (isToday && start <= nowMinutes) continue;
      const overlaps = busyRanges.some(([bs, be]) => start < be && end > bs);
      if (overlaps) continue;
      slots.push(toHHMM(start));
    }
  }
  // Dedup (overlapping working intervals can emit the same start) and globally sort so
  // the emitted grid is stable regardless of interval order. "HH:MM" strings sort
  // lexicographically in chronological order (zero-padded, 24h).
  return [...new Set(slots)].sort();
}

export function createBookingService() {
  async function resolveMaster(username: string) {
    const master = await bookingRepo.findMasterByUsername(username);
    if (!master?.masterProfile) {
      throw new NotFoundError('Master not found', 'MASTER_NOT_FOUND');
    }
    if (!master.masterProfile.bookingEnabled) {
      throw new BadRequestError('This master does not accept online bookings', 'BOOKING_DISABLED');
    }
    if (
      master.masterProfile.bookingPaymentMode !== 'NONE'
      && master.masterProfile.bookingPaymentChannel === 'FLITT'
      && !env.BOOKING_ONLINE_PAYMENTS_ENABLED
      && env.NODE_ENV !== 'test'
    ) {
      throw new BadRequestError('Online booking payments are temporarily unavailable', 'ONLINE_PAYMENTS_DISABLED');
    }
    return master;
  }

  function findService(services: unknown, serviceName: string): ServiceOption {
    const svc = mapServices(services).find((s) => s.name === serviceName);
    if (!svc) {
      throw new BadRequestError('Selected service is not offered by this master', 'INVALID_SERVICE');
    }
    return svc;
  }

  // Validates the slot is bookable, returns the computed end time + duration.
  async function assertSlotBookable(
    masterProfileId: string,
    workingHours: unknown,
    services: unknown,
    serviceName: string,
    date: Date,
    startTime: string,
  ): Promise<{ durationMinutes: number; endTime: string }> {
    const svc = findService(services, serviceName);
    const dateOnly = toDateOnly(date);
    const key = WEEKDAYS[dateOnly.getUTCDay()];
    const intervals = dayIntervals(workingHours, key);
    const busy = await bookingRepo.findActiveBookingsForDay(masterProfileId, dateOnly);
    const now = tbilisiNow();
    const free = computeSlots({
      intervals,
      durationMinutes: svc.durationMinutes,
      busy,
      isToday: dateKey(dateOnly) === now.dayKey,
      nowMinutes: now.minutes,
    });
    if (!free.includes(startTime)) {
      throw new ConflictError('That slot is no longer available', 'SLOT_UNAVAILABLE');
    }
    return { durationMinutes: svc.durationMinutes, endTime: toHHMM(toMinutes(startTime) + svc.durationMinutes) };
  }

  return {
    async getServices(username: string) {
      const master = await resolveMaster(username);
      return {
        masterName: master.firstName,
        username: master.username,
        paymentMode: master.masterProfile!.bookingPaymentMode,
        paymentChannel: master.masterProfile!.bookingPaymentChannel,
        depositAmount: master.masterProfile!.bookingPrepaymentAmount,
        paymentInfo: master.masterProfile!.bookingPaymentInfo,
        services: mapServices(master.masterProfile!.services),
      };
    },

    async getSlots(username: string, date: Date, serviceName: string) {
      const master = await resolveMaster(username);
      const svc = findService(master.masterProfile!.services, serviceName);
      const dateOnly = toDateOnly(date);
      const key = WEEKDAYS[dateOnly.getUTCDay()];
      const intervals = dayIntervals(master.masterProfile!.workingHours, key);
      const busy = await bookingRepo.findActiveBookingsForDay(master.masterProfile!.id, dateOnly);
      const now = tbilisiNow();
      const slots = computeSlots({
        intervals,
        durationMinutes: svc.durationMinutes,
        busy,
        isToday: dateKey(dateOnly) === now.dayKey,
        nowMinutes: now.minutes,
      });
      return { slots, dayClosed: intervals.length === 0, durationMinutes: svc.durationMinutes };
    },

    async requestBookOtp(username: string, input: RequestOtpInput) {
      const master = await resolveMaster(username);
      await assertSlotBookable(
        master.masterProfile!.id,
        master.masterProfile!.workingHours,
        master.masterProfile!.services,
        input.serviceName,
        input.date,
        input.startTime,
      );
      // Per-phone SMS-bomb throttle (in addition to the per-IP route limit).
      await assertOtpPhoneAllowed('booking', input.clientPhone);
      const { requestId } = await sendOtp(input.clientPhone);
      logger.info({ username }, 'Booking OTP requested');
      return { requestId };
    },

    async verifyAndBook(username: string, input: BookInput) {
      const master = await resolveMaster(username);
      const mp = master.masterProfile!;
      const { durationMinutes, endTime } = await assertSlotBookable(
        mp.id,
        mp.workingHours,
        mp.services,
        input.serviceName,
        input.date,
        input.startTime,
      );

      await verifyOtp(input.clientPhone, input.otpRequestId, input.code);

      const svc = findService(mp.services, input.serviceName);
      const mode = mp.bookingPaymentMode; // NONE | DEPOSIT | FULL
      const prepay = mode !== 'NONE';
      const paymentChannel = prepay
        ? (mp.bookingPaymentChannel ?? 'MANUAL')
        : 'MANUAL';
      const amount =
        mode === 'DEPOSIT'
          ? mp.bookingPrepaymentAmount ?? null
          : mode === 'FULL'
            ? typeof svc.price === 'number'
              ? svc.price
              : null
            : null;

      // A prepay booking with no resolvable amount would silently downgrade to an
      // unpriced off-platform hold (deposit misconfigured, or a FULL service with no
      // price). Refuse it up-front so the master fixes the config instead of taking a
      // booking they cannot charge for.
      if (prepay && amount === null) {
        throw new BadRequestError(
          'This master has not set a prepayment amount for the selected service',
          'PAYMENT_AMOUNT_UNCONFIGURED',
        );
      }
      const date = toDateOnly(input.date);
      const amountMinor = amount === null ? null : Math.round(amount * 100);
      const cancellationFeeAmountMinor = !prepay || amountMinor === null
        ? null
        : mode === 'DEPOSIT'
          ? amountMinor
          : Math.min(amountMinor, Math.round((mp.bookingPrepaymentAmount ?? amount ?? 0) * 100));
      const onlinePayment = prepay && paymentChannel === 'FLITT';
      if (onlinePayment && ((env.NODE_ENV !== 'test' && !env.BOOKING_ONLINE_PAYMENTS_ENABLED) || !isFlittConfigured())) {
        throw new BadRequestError('Online booking payments are temporarily unavailable', 'PAYMENT_UNAVAILABLE');
      }
      const bookingId = randomUUID();
      const manageToken = createBookingManageToken(bookingId);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const manageTokenExpiresAt = new Date(Date.UTC(
        date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), endHour - 4, endMinute,
      ) + 30 * 24 * 60 * 60 * 1000);

      let booking;
      try {
        booking = await bookingRepo.createBooking({
          id: bookingId,
          masterProfileId: mp.id,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          serviceName: input.serviceName,
          durationMinutes,
          date,
          startTime: input.startTime,
          endTime,
          paymentMode: mode,
          paymentChannel,
          prepaymentRequired: prepay,
          prepaymentAmount: prepay ? amount : null,
          prepaymentAmountMinor: prepay ? amountMinor : null,
          cancellationFeeAmountMinor,
          depositStatus: prepay ? 'AWAITING' : 'NONE',
          status: prepay ? 'PENDING' : 'CONFIRMED',
          otpRequestId: input.otpRequestId,
          note: input.note,
          manageTokenHash: hashBookingManageToken(manageToken),
          manageTokenExpiresAt,
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictError('That slot was just taken', 'SLOT_TAKEN');
        }
        throw err;
      }

      const result = {
        id: booking.id,
        status: booking.status,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        serviceName: booking.serviceName,
        paymentMode: booking.paymentMode,
        paymentChannel: booking.paymentChannel,
        prepaymentRequired: booking.prepaymentRequired,
        prepaymentAmount: booking.prepaymentAmount,
        depositStatus: booking.depositStatus,
        paymentInfo: prepay && paymentChannel === 'MANUAL' ? mp.bookingPaymentInfo : null,
        manageUrl: `${env.APP_URL}/booking/manage/${manageToken}`,
      };

      // Online payment (Flitt): hold the slot as PENDING and redirect the client to pay.
      // The booking auto-confirms on the verified server callback, not on a manual click.
      // `amount` is guaranteed non-null here for a prepay booking (guarded above).
      if (onlinePayment) {
        try {
          const payment = await bookingRepo.createPayment({ bookingId: booking.id, amountMinor: amountMinor!, currency: 'GEL' });
          const redirectUrl = await createFlittCheckout({
            orderId: payment.id,
            amountMinor: amountMinor!,
            description: `Glow Booking ${booking.id.slice(0, 8)}`,
            responseUrl: `${env.APP_URL}/booking/return`,
            serverCallbackUrl: `${env.PUBLIC_SERVER_URL}/api/v1/booking/payment/callback`,
          });
          sendSms(input.clientPhone, `Glow.GE: ჯავშნის მართვა ${result.manageUrl}`).catch(() => {});
          logger.info({ username, bookingId: booking.id, paymentId: payment.id }, 'Booking awaiting payment');
          return { ...result, redirectUrl };
        } catch (err) {
          logger.error({ err, bookingId: booking.id }, 'Flitt checkout failed');
          const payment = await bookingRepo.findPaymentByBookingId?.(booking.id);
          if (payment) await bookingRepo.markPaymentFailed(payment.id, booking.id, true);
          throw new BadRequestError('Could not start online payment. Please try again.', 'PAYMENT_CHECKOUT_FAILED');
        }
      }

      // Explicit manual-payment path for masters who keep settlement outside Glow.
      // For a PREPAY booking this leaves a PENDING booking holding the slot with no
      // gateway timeout to release it. Anchor it with an `offline` PENDING Payment so the
      // stale-PENDING sweep (src/jobs) has a concrete, timestamped row to age out — the
      // sweep expires bookings whose offline payment has sat PENDING past its grace window.
      // (A NONE-mode booking is already CONFIRMED and needs no hold.)
      if (prepay && paymentChannel === 'MANUAL') {
        try {
          await bookingRepo.createOfflinePayment({ bookingId: booking.id, amount: amount!, amountMinor: amountMinor!, currency: 'GEL' });
        } catch (err) {
          // Never fail the booking on the hold-record write; log for the sweep's sake.
          logger.error({ err, bookingId: booking.id }, 'Failed to create offline payment hold');
        }
      }

      // Notify the master now; any prepayment is settled manually off-platform.
      const masterPhone = mp.phone ?? master.phone;
      if (masterPhone) {
        sendSms(
          masterPhone,
          `Glow.GE: ახალი ჯავშანი ${dateKey(date)} ${input.startTime}, ${input.serviceName}.`,
        ).catch(() => {});
      }
      sendSms(input.clientPhone, `Glow.GE: ჯავშნის მართვა ${result.manageUrl}`).catch(() => {});

      logger.info({ username, bookingId: booking.id }, 'Booking created');
      return { ...result, redirectUrl: null };
    },

    async handlePaymentCallback(body: Record<string, unknown>) {
      if (!verifyFlittCallback(body)) {
        throw new BadRequestError('Invalid payment signature', 'INVALID_SIGNATURE');
      }
      const orderId = typeof body.order_id === 'string' ? body.order_id : '';
      const payment = orderId ? await bookingRepo.findPaymentWithBooking(orderId) : null;
      if (!payment || !payment.booking) {
        logger.warn({ orderId }, 'Flitt callback for unknown payment');
        return; // ack so Flitt stops retrying
      }

      // Pin every callback, including later reversal callbacks, to this merchant and currency.
      const bodyMerchantId = Number(body.merchant_id);
      if (!Number.isFinite(bodyMerchantId) || bodyMerchantId !== env.FLITT_MERCHANT_ID) {
        await bookingRepo.markPaymentReconciliationRequired(payment.id);
        logger.warn({ paymentId: payment.id, bodyMerchantId }, 'Flitt callback merchant_id mismatch — ignored');
        return;
      }
      const bodyCurrency = typeof body.currency === 'string' ? body.currency : null;
      if (bodyCurrency !== payment.currency) {
        await bookingRepo.markPaymentReconciliationRequired(payment.id);
        logger.warn(
          { paymentId: payment.id, bodyCurrency, expected: payment.currency },
          'Flitt callback currency mismatch — ignored',
        );
        return;
      }

      // Terminal-state guard: BOTH PAID and FAILED are terminal. Once a payment has
      // settled either way, a later out-of-order callback (a stray 'approved' after a
      // 'declined', or a duplicate 'approved') must not re-drive the booking. A 'reversed'
      // /refund arriving after PAID is handled explicitly below.
      if (['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'].includes(payment.status)) {
        if (body.order_status === 'reversed' && ['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
          const reversalAmount = Number(body.reversal_amount);
          if (Number.isFinite(reversalAmount) && reversalAmount > 0) {
            await recordGatewayReversal({
              paymentId: payment.id,
              amountMinor: reversalAmount,
              providerRefundId: typeof body.payment_id === 'string' ? body.payment_id : undefined,
            });
            logger.info({ paymentId: payment.id, bookingId: payment.booking.id }, 'Gateway reversal reconciled');
          } else {
            await bookingRepo.markPaymentReconciliationRequired(payment.id);
            logger.warn({ paymentId: payment.id }, 'Gateway reversal callback missing a valid reversal_amount');
          }
        }
        return; // idempotent: already terminal
      }

      const paidCoins = Number(body.amount);
      const amountMatches = Number.isFinite(paidCoins) && payment.amountMinor === paidCoins;
      const b = payment.booking;
      const masterPhone = b.masterProfile?.phone ?? b.masterProfile?.user?.phone ?? null;
      const flittPaymentId = typeof body.payment_id === 'string' ? body.payment_id : String(body.payment_id ?? '') || null;

      if (isFlittApproved(body) && amountMatches) {
        // markPaymentPaid is scoped to a still-PENDING payment (repo WHERE guard), so two
        // concurrent 'approved' callbacks that both pass the read-check can't both confirm.
        await bookingRepo.markPaymentPaid(payment.id, b.id, flittPaymentId);
        if (masterPhone) {
          sendSms(masterPhone, `Glow.GE: გადახდილი ჯავშანი ${dateKey(b.date)} ${b.startTime}, ${b.serviceName}.`).catch(() => {});
        }
        const manageUrl = `${env.APP_URL}/booking/manage/${createBookingManageToken(b.id)}`;
        sendSms(b.clientPhone, `Glow.GE: გადახდა მიღებულია, ჯავშანი დადასტურდა ${dateKey(b.date)} ${b.startTime}. მართვა: ${manageUrl}`).catch(() => {});
        logger.info({ paymentId: payment.id, bookingId: b.id }, 'Payment approved, booking confirmed');
        return;
      }

      if (isFlittApproved(body) && !amountMatches) {
        if (Number.isFinite(paidCoins) && paidCoins > 0) {
          await bookingRepo.markPaymentCapturedForReconciliation(payment.id, paidCoins, flittPaymentId);
        } else {
          await bookingRepo.markPaymentReconciliationRequired(payment.id);
        }
        logger.warn({ paymentId: payment.id, bookingId: b.id, paidCoins }, 'Captured payment amount mismatch — queued for reconciliation');
        return;
      }

      if (isFlittTerminalFailure(body)) {
        await bookingRepo.markPaymentFailed(payment.id, b.id, true);
        logger.warn({ paymentId: payment.id, bookingId: b.id, status: body.order_status, amountMatches }, 'Payment failed, booking cancelled');
      }
    },

    async listForMaster(userId: string, query: MasterListQueryInput) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      return bookingRepo.listByMaster(profile.id, {
        page: query.page,
        limit: query.limit,
        status: query.status,
        date: query.date ? toDateOnly(query.date) : undefined,
      });
    },

    async summaryForMaster(userId: string) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const grouped = await bookingRepo.aggregateByDate(profile.id, toDateOnly(new Date()));
      const byDate = new Map<string, { date: Date; pending: number; confirmed: number }>();
      for (const row of grouped) {
        const k = row.date.toISOString();
        const b = byDate.get(k) ?? { date: row.date, pending: 0, confirmed: 0 };
        if (row.status === 'PENDING') b.pending += row._count._all;
        if (row.status === 'CONFIRMED') b.confirmed += row._count._all;
        byDate.set(k, b);
      }
      return Array.from(byDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    },

    async updateStatus(userId: string, bookingId: string, status: string) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const booking = await bookingRepo.findById(bookingId);
      if (!booking) throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
      if (booking.masterProfileId !== profile.id) {
        throw new ForbiddenError('You do not own this booking', 'NOT_OWNER');
      }

      // ── Status-transition guard ──────────────────────────────────────
      // A booking may only move along a legal edge; terminal states are frozen.
      const current = booking.status;
      const next = status;
      if (!isBookingStatus(current) || !isBookingStatus(next)) {
        throw new BadRequestError('Unknown booking status', 'INVALID_STATUS');
      }
      if (current === next) {
        throw new ConflictError(`Booking is already ${current}`, 'STATUS_UNCHANGED');
      }
      if (!BOOKING_TRANSITIONS[current].includes(next)) {
        throw new ConflictError(
          `Cannot change a ${current} booking to ${next}`,
          'ILLEGAL_STATUS_TRANSITION',
        );
      }
      // Confirming a prepay booking requires the money to have actually landed.
      // NONE-mode books confirm freely; DEPOSIT/FULL confirm only once the deposit
      // is RECEIVED (marked by the Flitt callback or the manual deposit-received path).
      if (next === 'CONFIRMED' && booking.paymentMode !== 'NONE' && booking.depositStatus !== 'RECEIVED') {
        throw new ConflictError(
          'Cannot confirm a booking before its prepayment is received',
          'PREPAYMENT_NOT_RECEIVED',
        );
      }
      if (next === 'CANCELLED' || next === 'NO_SHOW') {
        await paymentsService.cancelBooking({
          bookingId,
          actor: next === 'NO_SHOW' ? 'NO_SHOW' : 'MASTER',
          actorUserId: userId,
          reason: next === 'NO_SHOW' ? 'Client did not attend' : 'Master cancelled the booking',
        });
        return bookingRepo.findById(bookingId);
      }
      // Keep depositStatus coherent: confirming a NONE-mode booking never touches the
      // deposit; the RECEIVED case is already RECEIVED. No override needed here.

      const updated = await bookingRepo.updateStatus(bookingId, status);
      if (status === 'CONFIRMED') {
        const msg =
          `Glow.GE: თქვენი ჯავშანი დადასტურდა ${dateKey(booking.date)} ${booking.startTime}.`;
        sendSms(booking.clientPhone, msg).catch(() => {});
      }
      return updated;
    },

    async markDepositReceived(userId: string, bookingId: string) {
      const profile = await bookingRepo.findMasterProfileByUserId(userId);
      if (!profile) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const booking = await bookingRepo.findById(bookingId);
      if (!booking) throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
      if (booking.masterProfileId !== profile.id) {
        throw new ForbiddenError('You do not own this booking', 'NOT_OWNER');
      }
      if (booking.paymentChannel === 'FLITT') {
        throw new ConflictError(
          'Online payments can only be confirmed by the signed payment callback',
          'ONLINE_PAYMENT_REQUIRES_CALLBACK',
        );
      }
      const updated = await bookingRepo.setDepositReceived(bookingId);
      sendSms(
        booking.clientPhone,
        `Glow.GE: დეპოზიტი მიღებულია, ჯავშანი დადასტურდა ${dateKey(booking.date)} ${booking.startTime}.`,
      ).catch(() => {});
      return updated;
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
export const bookingService = createBookingService();
