import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@/libs/prisma.js';
import type { Prisma } from '@prisma/client';
import { ConflictError } from '@/shared/errors/errors.js';
import type {
  CancellationBooking,
  PaymentsRepository,
  PrepareCancellationInput,
} from './payments.service.js';

const CANCELLATION_SELECT = {
  id: true,
  status: true,
  date: true,
  startTime: true,
  endTime: true,
  clientPhone: true,
  clientName: true,
  serviceName: true,
  masterProfileId: true,
  paymentChannel: true,
  cancellationFeeAmountMinor: true,
  manageTokenExpiresAt: true,
  masterProfile: { select: { userId: true } },
  payment: {
    select: {
      id: true,
      provider: true,
      amountMinor: true,
      refundedAmountMinor: true,
      currency: true,
      status: true,
      refunds: {
        where: { status: { in: ['REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, amountMinor: true, status: true },
      },
    },
  },
} satisfies Prisma.BookingSelect;

type CancellationRow = Prisma.BookingGetPayload<{ select: typeof CANCELLATION_SELECT }>;

async function findById(id: string) {
  return prisma.booking.findUnique({ where: { id }, select: CANCELLATION_SELECT });
}

function mapCancellation(row: CancellationRow): CancellationBooking {
  const payment = row.payment;
  return {
    id: row.id,
    status: row.status,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    clientPhone: row.clientPhone,
    clientName: row.clientName,
    serviceName: row.serviceName,
    masterProfileId: row.masterProfileId,
    masterUserId: row.masterProfile.userId,
    paymentChannel: row.paymentChannel,
    cancellationFeeAmountMinor: row.cancellationFeeAmountMinor,
    manageTokenExpiresAt: row.manageTokenExpiresAt,
    payment: payment ? {
      id: payment.id,
      provider: payment.provider,
      amountMinor: payment.amountMinor,
      refundedAmountMinor: payment.refundedAmountMinor,
      currency: payment.currency,
      status: payment.status,
    } : null,
    existingRefund: payment?.refunds[0] ?? null,
  };
}

export const paymentsRepo: PaymentsRepository = {
  async findBookingByIdForCancellation(bookingId) {
    const row = await findById(bookingId);
    return row ? mapCancellation(row) : null;
  },

  async findBookingByManageTokenHash(manageTokenHash) {
    const row = await prisma.booking.findUnique({
      where: { manageTokenHash },
      select: CANCELLATION_SELECT,
    });
    return row ? mapCancellation(row) : null;
  },

  async prepareCancellation(input: PrepareCancellationInput) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        select: { id: true, status: true, masterProfileId: true, payment: { select: { id: true, amountMinor: true, refundedAmountMinor: true, currency: true } } },
      });
      if (!booking) return { created: false, refund: null };

      if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
        const existing = booking.payment
          ? await tx.refund.findFirst({
              where: { paymentId: booking.payment.id },
              orderBy: { createdAt: 'desc' },
              select: { id: true, reverseId: true, amountMinor: true },
            })
          : null;
        return { created: false, refund: existing };
      }

      const changed = await tx.booking.updateMany({
        where: { id: input.bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: {
          status: input.actor === 'NO_SHOW' ? 'NO_SHOW' : 'CANCELLED',
          cancelledAt: input.cancelledAt,
          cancelledBy: input.actor,
          cancellationReason: input.reason,
          earningEligibleAt: input.retainedAmountMinor > 0 ? input.earningEligibleAt : null,
        },
      });
      if (changed.count === 0) return { created: false, refund: null };

      if (input.retainedAmountMinor > 0 && booking.payment) {
        await tx.masterLedgerEntry.upsert({
          where: { sourceKey: `retained:${booking.payment.id}` },
          create: {
            masterProfileId: booking.masterProfileId,
            bookingId: booking.id,
            paymentId: booking.payment.id,
            sourceKey: `retained:${booking.payment.id}`,
            type: 'EARNING',
            amountMinor: input.retainedAmountMinor,
            currency: booking.payment.currency,
            availableAt: input.earningEligibleAt,
            note: input.policyCode,
          },
          update: {},
        });
      }

      if (!booking.payment || input.refundAmountMinor <= 0) return { created: true, refund: null };
      const remaining = Math.max(0, booking.payment.amountMinor - booking.payment.refundedAmountMinor);
      if (input.refundAmountMinor > remaining) throw new Error('REFUND_EXCEEDS_CAPTURED_AMOUNT');
      const refundId = randomUUID();
      const reserved = await tx.payment.updateMany({
        where: { id: booking.payment.id, activeRefundId: null },
        data: { activeRefundId: refundId },
      });
      if (reserved.count === 0) throw new ConflictError('Another refund is already in progress', 'REFUND_ALREADY_IN_PROGRESS');
      const refund = await tx.refund.create({
        data: {
          id: refundId,
          paymentId: booking.payment.id,
          reverseId: randomUUID(),
          amountMinor: input.refundAmountMinor,
          currency: booking.payment.currency,
          reason: input.reason,
          actor: input.actor,
          actorUserId: input.actorUserId,
          policyCode: input.policyCode,
        },
        select: { id: true, reverseId: true, amountMinor: true },
      });
      return { created: true, refund };
    });
  },

  async finishRefund(input) {
    await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({ where: { id: input.refundId }, select: { status: true } });
      if (!refund || refund.status === 'SUCCEEDED') return;
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        select: { amountMinor: true, refundedAmountMinor: true },
      });
      if (!payment) throw new Error('PAYMENT_NOT_FOUND');
      const refundedAmountMinor = payment.refundedAmountMinor + input.amountMinor;
      if (refundedAmountMinor > payment.amountMinor) throw new Error('REFUND_EXCEEDS_CAPTURED_AMOUNT');
      await tx.refund.update({
        where: { id: input.refundId },
        data: {
          status: 'SUCCEEDED',
          providerRefundId: input.providerRefundId,
          completedAt: input.completedAt,
          failureCode: null,
          failureMessage: null,
        },
      });
      await tx.payment.update({
        where: { id: input.paymentId },
        data: {
          refundedAmountMinor,
          status: refundedAmountMinor === payment.amountMinor ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          reconciliationRequired: false,
          activeRefundId: null,
        },
      });
    });
  },

  async markRefundProcessing(refundId, providerRefundId) {
    await prisma.refund.update({ where: { id: refundId }, data: { status: 'PROCESSING', providerRefundId } });
  },

  async markRefundFailed(refundId, code, message) {
    await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.update({
        where: { id: refundId },
        data: { status: 'FAILED', failureCode: code, failureMessage: message },
        select: { paymentId: true },
      });
      await tx.payment.updateMany({
        where: { id: refund.paymentId, activeRefundId: refundId },
        data: { activeRefundId: null },
      });
    });
  },

  async createRefundDebit(input) {
    if (!input.booking.payment) return;
    await prisma.$transaction(async (tx) => {
      const sourceKey = `refund:${input.refundId}`;
      if (await tx.masterLedgerEntry.findUnique({ where: { sourceKey }, select: { id: true } })) return;
      const earning = await tx.masterLedgerEntry.findFirst({
        where: { paymentId: input.booking.payment!.id, type: 'EARNING' },
        select: { payoutItem: { select: { payout: { select: { id: true, amountMinor: true, status: true } } } } },
      });
      if (!earning) return;
      const amountMinor = -input.amountMinor;
      const debit = await tx.masterLedgerEntry.create({
        data: {
          masterProfileId: input.booking.masterProfileId,
          bookingId: input.booking.id,
          paymentId: input.booking.payment!.id,
          sourceKey,
          type: 'REFUND_DEBIT',
          amountMinor,
          currency: input.booking.payment!.currency,
          availableAt: input.availableAt,
        },
      });
      const draft = earning.payoutItem?.payout;
      if (draft?.status === 'DRAFT') {
        const nextAmount = draft.amountMinor + amountMinor;
        if (nextAmount > 0) {
          await tx.payoutItem.create({ data: { payoutId: draft.id, ledgerEntryId: debit.id, amountMinor } });
          await tx.payout.update({ where: { id: draft.id }, data: { amountMinor: nextAmount } });
        } else {
          await tx.payoutItem.deleteMany({ where: { payoutId: draft.id } });
          await tx.payout.update({ where: { id: draft.id }, data: { amountMinor: 0, status: 'VOID' } });
        }
      }
    });
  },
};

export async function recordGatewayReversal(input: {
  paymentId: string;
  amountMinor: number;
  providerRefundId?: string;
}): Promise<void> {
  const debit = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      select: {
        id: true,
        amountMinor: true,
        refundedAmountMinor: true,
        currency: true,
        booking: { select: { id: true, masterProfileId: true } },
      },
    });
    if (!payment) return null;
    const remaining = Math.max(0, payment.amountMinor - payment.refundedAmountMinor);
    const amountMinor = Math.min(remaining, Math.max(0, input.amountMinor));
    if (amountMinor === 0) {
      await tx.payment.update({ where: { id: payment.id }, data: { reconciliationRequired: false } });
      return null;
    }

    const pending = await tx.refund.findFirst({
      where: { paymentId: payment.id, amountMinor, status: { in: ['REQUESTED', 'PROCESSING', 'FAILED'] } },
      orderBy: { createdAt: 'asc' },
    });
    const reverseId = pending?.reverseId ?? `gateway-${createHash('sha256')
      .update(`${payment.id}:${input.providerRefundId ?? ''}:${payment.refundedAmountMinor + amountMinor}`)
      .digest('hex').slice(0, 48)}`;
    const refund = pending
      ? await tx.refund.update({
          where: { id: pending.id },
          data: { status: 'SUCCEEDED', providerRefundId: input.providerRefundId, completedAt: new Date(), failureCode: null, failureMessage: null },
        })
      : await tx.refund.upsert({
          where: { reverseId },
          create: {
            paymentId: payment.id,
            reverseId,
            amountMinor,
            currency: payment.currency,
            status: 'SUCCEEDED',
            reason: 'Gateway reversal callback',
            actor: 'SYSTEM',
            policyCode: 'GATEWAY_RECONCILIATION',
            providerRefundId: input.providerRefundId,
            completedAt: new Date(),
          },
          update: {},
        });
    if (refund.status !== 'SUCCEEDED') return null;

    const refundedAmountMinor = payment.refundedAmountMinor + amountMinor;
    const paymentUpdated = await tx.payment.updateMany({
      where: { id: payment.id, refundedAmountMinor: payment.refundedAmountMinor },
      data: {
        refundedAmountMinor,
        status: refundedAmountMinor >= payment.amountMinor ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        reconciliationRequired: false,
        activeRefundId: null,
      },
    });
    if (paymentUpdated.count === 0) return null;
    return { bookingId: payment.booking.id, refundId: refund.id, amountMinor };
  });
  if (!debit) return;
  const booking = await paymentsRepo.findBookingByIdForCancellation(debit.bookingId);
  if (booking) {
    await paymentsRepo.createRefundDebit({
      booking,
      refundId: debit.refundId,
      amountMinor: debit.amountMinor,
      availableAt: new Date(),
    });
  }
}
