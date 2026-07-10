import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/errors.js';
import { quoteBookingCancellation, type CancellationActor } from './payment-policy.js';
import { hashBookingManageToken } from './manage-token.js';

export interface CancellationPayment {
  id: string;
  provider: string;
  amountMinor: number;
  refundedAmountMinor: number;
  currency: string;
  status: string;
}

export interface CancellationBooking {
  id: string;
  status: string;
  date: Date;
  startTime: string;
  endTime: string;
  clientPhone: string;
  clientName: string;
  serviceName: string;
  masterProfileId: string;
  masterUserId: string;
  paymentChannel: string;
  cancellationFeeAmountMinor: number | null;
  manageTokenExpiresAt: Date | null;
  payment: CancellationPayment | null;
  existingRefund: {
    id: string;
    amountMinor: number;
    status: string;
  } | null;
}

export interface PrepareCancellationInput {
  bookingId: string;
  actor: CancellationActor;
  actorUserId?: string;
  reason: string;
  policyCode: string;
  refundAmountMinor: number;
  retainedAmountMinor: number;
  cancelledAt: Date;
  earningEligibleAt: Date;
}

export interface PaymentsRepository {
  findBookingByIdForCancellation(bookingId: string): Promise<CancellationBooking | null>;
  findBookingByManageTokenHash(tokenHash: string): Promise<CancellationBooking | null>;
  prepareCancellation(input: PrepareCancellationInput): Promise<{
    created: boolean;
    refund: { id: string; reverseId: string; amountMinor: number } | null;
  }>;
  finishRefund(input: {
    refundId: string;
    paymentId: string;
    amountMinor: number;
    providerRefundId?: string;
    completedAt: Date;
  }): Promise<void>;
  markRefundProcessing(refundId: string, providerRefundId?: string): Promise<void>;
  markRefundFailed(refundId: string, code: string, message: string): Promise<void>;
  createRefundDebit(input: {
    booking: CancellationBooking;
    refundId: string;
    amountMinor: number;
    availableAt: Date;
  }): Promise<void>;
}

export interface PaymentGateway {
  reverse(input: {
    orderId: string;
    amountMinor: number;
    currency: string;
    reverseId: string;
    comment?: string;
  }): Promise<
    | { status: 'SUCCEEDED' | 'PROCESSING'; providerRefundId?: string; reversalAmountMinor: number }
    | { status: 'FAILED'; failureCode: string; failureMessage: string; reversalAmountMinor: number }
  >;
  status(orderId: string): Promise<{ orderStatus: string; reversalAmountMinor: number }>;
}

interface PaymentsServiceDeps {
  repo: PaymentsRepository;
  gateway: PaymentGateway;
  now?: () => Date;
  notify?: (phone: string, message: string) => Promise<void> | void;
}

function appointmentStartUtc(booking: Pick<CancellationBooking, 'date' | 'startTime'>): Date {
  const [hours, minutes] = booking.startTime.split(':').map(Number);
  return new Date(Date.UTC(
    booking.date.getUTCFullYear(),
    booking.date.getUTCMonth(),
    booking.date.getUTCDate(),
    hours - 4,
    minutes,
  ));
}

export function createPaymentsService(deps: PaymentsServiceDeps) {
  const now = deps.now ?? (() => new Date());
  const notify = deps.notify ?? (() => undefined);

  function cancellationView(booking: CancellationBooking, at: Date) {
    const appointmentStart = appointmentStartUtc(booking);
    const payment = booking.payment;
    const paidAmountMinor = payment && ['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)
      ? Math.max(0, payment.amountMinor - payment.refundedAmountMinor)
      : 0;
    const quote = quoteBookingCancellation({
      actor: 'CLIENT',
      now: at,
      appointmentStart,
      paidAmountMinor,
      cancellationFeeAmountMinor: booking.cancellationFeeAmountMinor ?? paidAmountMinor,
    });
    return {
      id: booking.id,
      status: booking.status,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      clientName: booking.clientName,
      serviceName: booking.serviceName,
      currency: payment?.currency ?? 'GEL',
      cancellationDeadline: new Date(appointmentStart.getTime() - 24 * 60 * 60 * 1000),
      ...quote,
    };
  }

  async function getManagedBooking(token: string) {
    if (!token) throw new NotFoundError('Booking management link is invalid', 'MANAGE_TOKEN_INVALID');
    const booking = await deps.repo.findBookingByManageTokenHash(hashBookingManageToken(token));
    if (!booking) throw new NotFoundError('Booking management link is invalid', 'MANAGE_TOKEN_INVALID');
    const at = now();
    if (!booking.manageTokenExpiresAt || booking.manageTokenExpiresAt.getTime() < at.getTime()) {
      throw new NotFoundError('Booking management link has expired', 'MANAGE_TOKEN_EXPIRED');
    }
    return cancellationView(booking, at);
  }

  async function cancelBooking(input: {
    bookingId: string;
    actor: CancellationActor;
    actorUserId?: string;
    reason: string;
  }) {
    const booking = await deps.repo.findBookingByIdForCancellation(input.bookingId);
    if (!booking) throw new NotFoundError('Booking not found', 'BOOKING_NOT_FOUND');
    if ((input.actor === 'MASTER' || input.actor === 'NO_SHOW') && booking.masterUserId !== input.actorUserId) {
      throw new ForbiddenError('You do not own this booking', 'NOT_OWNER');
    }
    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
      if (booking.existingRefund) {
        return {
          bookingId: booking.id,
          refundAmountMinor: booking.existingRefund.amountMinor,
          retainedAmountMinor: Math.max(0, (booking.payment?.amountMinor ?? 0) - booking.existingRefund.amountMinor),
          refundStatus: booking.existingRefund.status,
        };
      }
      throw new ConflictError('Booking is already cancelled', 'BOOKING_ALREADY_CANCELLED');
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new ConflictError(`Cannot cancel a ${booking.status} booking`, 'ILLEGAL_STATUS_TRANSITION');
    }

    const at = now();
    if (input.actor === 'NO_SHOW' && at.getTime() < appointmentStartUtc(booking).getTime()) {
      throw new ConflictError('A booking cannot be marked no-show before it starts', 'NO_SHOW_BEFORE_APPOINTMENT');
    }
    const payment = booking.payment;
    const refundableCaptured = booking.paymentChannel === 'FLITT'
      && payment
      && ['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)
      ? Math.max(0, payment.amountMinor - payment.refundedAmountMinor)
      : 0;
    const quote = quoteBookingCancellation({
      actor: input.actor,
      now: at,
      appointmentStart: appointmentStartUtc(booking),
      paidAmountMinor: refundableCaptured,
      cancellationFeeAmountMinor: booking.cancellationFeeAmountMinor ?? refundableCaptured,
    });
    const prepared = await deps.repo.prepareCancellation({
      bookingId: booking.id,
      actor: input.actor,
      actorUserId: input.actorUserId,
      reason: input.reason,
      policyCode: quote.policyCode,
      refundAmountMinor: quote.refundAmountMinor,
      retainedAmountMinor: quote.retainedAmountMinor,
      cancelledAt: at,
      earningEligibleAt: new Date(appointmentStartUtc(booking).getTime() + 24 * 60 * 60 * 1000),
    });

    if (!prepared.refund || !payment) {
      await notify(booking.clientPhone, 'Glow.GE: თქვენი ჯავშანი გაუქმდა.');
      return { bookingId: booking.id, ...quote, refundStatus: 'NOT_REQUIRED' as const };
    }

    try {
      const result = await deps.gateway.reverse({
        orderId: payment.id,
        amountMinor: prepared.refund.amountMinor,
        currency: payment.currency,
        reverseId: prepared.refund.reverseId,
        comment: input.reason,
      });
      if (result.status === 'SUCCEEDED') {
        await deps.repo.finishRefund({
          refundId: prepared.refund.id,
          paymentId: payment.id,
          amountMinor: prepared.refund.amountMinor,
          providerRefundId: result.providerRefundId,
          completedAt: at,
        });
        await deps.repo.createRefundDebit({
          booking,
          refundId: prepared.refund.id,
          amountMinor: prepared.refund.amountMinor,
          availableAt: at,
        });
      } else if (result.status === 'PROCESSING') {
        await deps.repo.markRefundProcessing(prepared.refund.id, result.providerRefundId);
      } else if ('failureCode' in result) {
        await deps.repo.markRefundFailed(prepared.refund.id, result.failureCode, result.failureMessage);
      }
      await notify(
        booking.clientPhone,
        result.status === 'SUCCEEDED'
          ? `Glow.GE: ჯავშანი გაუქმდა. დაბრუნებულია ${(prepared.refund.amountMinor / 100).toFixed(2)} GEL.`
          : 'Glow.GE: ჯავშანი გაუქმდა. თანხის დაბრუნება მუშავდება.',
      );
      return { bookingId: booking.id, ...quote, refundStatus: result.status };
    } catch {
      await deps.repo.markRefundProcessing(prepared.refund.id);
      await notify(booking.clientPhone, 'Glow.GE: ჯავშანი გაუქმდა. თანხის დაბრუნება მუშავდება.');
      return { bookingId: booking.id, ...quote, refundStatus: 'PROCESSING' as const };
    }
  }

  async function cancelByManageToken(token: string, reason: string) {
    const managed = await getManagedBooking(token);
    return cancelBooking({ bookingId: managed.id, actor: 'CLIENT', reason });
  }

  return { getManagedBooking, cancelByManageToken, cancelBooking };
}

export type PaymentsService = ReturnType<typeof createPaymentsService>;
