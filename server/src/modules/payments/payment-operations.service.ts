import { randomUUID } from 'node:crypto';
import { prisma } from '@/libs/prisma.js';
import { createFlittReversal, getFlittOrderStatus } from '@/libs/flitt.js';
import { ConflictError, NotFoundError } from '@/shared/errors/errors.js';
import { paymentsRepo, recordGatewayReversal } from './payments.repo.js';
import { env } from '@/config/env.js';
import { groupPayoutCandidates } from './payment-ledger.js';

async function executeRefund(refund: {
  id: string;
  paymentId: string;
  reverseId: string;
  amountMinor: number;
  currency: string;
  reason: string;
}) {
  try {
    const result = await createFlittReversal({
      orderId: refund.paymentId,
      amountMinor: refund.amountMinor,
      currency: refund.currency,
      reverseId: refund.reverseId,
      comment: refund.reason,
    });
    if (result.status === 'SUCCEEDED') {
      await paymentsRepo.finishRefund({
        refundId: refund.id,
        paymentId: refund.paymentId,
        amountMinor: refund.amountMinor,
        providerRefundId: result.providerRefundId,
        completedAt: new Date(),
      });
      const payment = await prisma.payment.findUnique({ where: { id: refund.paymentId }, select: { bookingId: true } });
      if (payment) {
        const booking = await paymentsRepo.findBookingByIdForCancellation(payment.bookingId);
        if (booking) await paymentsRepo.createRefundDebit({
          booking,
          refundId: refund.id,
          amountMinor: refund.amountMinor,
          availableAt: new Date(),
        });
      }
    } else if (result.status === 'PROCESSING') {
      await paymentsRepo.markRefundProcessing(refund.id, result.providerRefundId);
    } else if ('failureCode' in result) {
      await paymentsRepo.markRefundFailed(refund.id, result.failureCode, result.failureMessage);
    }
    return { refundId: refund.id, status: result.status };
  } catch {
    await paymentsRepo.markRefundProcessing(refund.id);
    return { refundId: refund.id, status: 'PROCESSING' as const };
  }
}

export const paymentOperationsService = {
  async listPayments() {
    return prisma.payment.findMany({
      where: { OR: [{ provider: 'flitt' }, { reconciliationRequired: true }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        amountMinor: true,
        refundedAmountMinor: true,
        currency: true,
        reconciliationRequired: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            status: true,
            clientName: true,
            serviceName: true,
            date: true,
            masterProfile: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  },

  async getMasterBalance(userId: string) {
    const master = await prisma.masterProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!master) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
    const now = new Date();
    const [available, pending, paid, payouts] = await Promise.all([
      prisma.masterLedgerEntry.aggregate({
        where: { masterProfileId: master.id, availableAt: { lte: now }, payoutItem: null },
        _sum: { amountMinor: true },
      }),
      prisma.masterLedgerEntry.aggregate({
        where: { masterProfileId: master.id, availableAt: { gt: now }, payoutItem: null },
        _sum: { amountMinor: true },
      }),
      prisma.payout.aggregate({ where: { masterProfileId: master.id, status: 'PAID' }, _sum: { amountMinor: true } }),
      prisma.payout.findMany({
        where: { masterProfileId: master.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, amountMinor: true, currency: true, status: true, transferReference: true, paidAt: true, createdAt: true },
      }),
    ]);
    return {
      currency: 'GEL',
      availableMinor: available._sum.amountMinor ?? 0,
      pendingMinor: pending._sum.amountMinor ?? 0,
      paidMinor: paid._sum.amountMinor ?? 0,
      payouts,
    };
  },

  async listRefunds(status?: string) {
    return prisma.refund.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        payment: {
          select: {
            id: true,
            amountMinor: true,
            refundedAmountMinor: true,
            booking: { select: { id: true, clientName: true, serviceName: true, masterProfile: { select: { user: { select: { firstName: true, lastName: true } } } } } },
          },
        },
      },
    });
  },

  async createAdminRefund(adminUserId: string, paymentId: string, amountMinor: number | undefined, reason: string) {
    const refund = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, amountMinor: true, refundedAmountMinor: true, currency: true, status: true },
      });
      if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
      if (!['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
        throw new ConflictError('Payment is not refundable', 'PAYMENT_NOT_REFUNDABLE');
      }
      const remaining = payment.amountMinor - payment.refundedAmountMinor;
      const requested = amountMinor ?? remaining;
      if (requested <= 0 || requested > remaining) {
        throw new ConflictError('Refund exceeds the captured balance', 'REFUND_EXCEEDS_CAPTURED_AMOUNT');
      }
      const refundId = randomUUID();
      const reserved = await tx.payment.updateMany({
        where: { id: paymentId, activeRefundId: null },
        data: { activeRefundId: refundId },
      });
      if (reserved.count === 0) {
        throw new ConflictError('Another refund is already in progress', 'REFUND_ALREADY_IN_PROGRESS');
      }
      return tx.refund.create({
        data: {
          id: refundId,
          paymentId,
          reverseId: randomUUID(),
          amountMinor: requested,
          currency: payment.currency,
          reason,
          actor: 'ADMIN',
          actorUserId: adminUserId,
          policyCode: 'ADMIN_EXCEPTION',
        },
        select: { id: true, paymentId: true, reverseId: true, amountMinor: true, currency: true, reason: true },
      });
    });
    return executeRefund(refund);
  },

  async retryRefund(refundId: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      select: { id: true, paymentId: true, reverseId: true, amountMinor: true, currency: true, reason: true, status: true },
    });
    if (!refund) throw new NotFoundError('Refund not found', 'REFUND_NOT_FOUND');
    if (!['FAILED', 'PROCESSING'].includes(refund.status)) {
      throw new ConflictError('Refund is not retryable', 'REFUND_NOT_RETRYABLE');
    }
    await prisma.$transaction(async (tx) => {
      const reserved = await tx.payment.updateMany({
        where: {
          id: refund.paymentId,
          OR: [{ activeRefundId: null }, { activeRefundId: refund.id }],
        },
        data: { activeRefundId: refund.id },
      });
      if (reserved.count === 0) throw new ConflictError('Another refund is already in progress', 'REFUND_ALREADY_IN_PROGRESS');
      await tx.refund.update({ where: { id: refundId }, data: { status: 'REQUESTED', failureCode: null, failureMessage: null } });
    });
    return executeRefund(refund);
  },

  async reconcileRefund(refundId: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      select: { id: true, paymentId: true, amountMinor: true, status: true, payment: { select: { bookingId: true } } },
    });
    if (!refund) throw new NotFoundError('Refund not found', 'REFUND_NOT_FOUND');
    const result = await getFlittOrderStatus(refund.paymentId);
    const payment = await prisma.payment.findUnique({ where: { id: refund.paymentId }, select: { refundedAmountMinor: true } });
    if (payment && result.reversalAmountMinor >= payment.refundedAmountMinor + refund.amountMinor) {
      await paymentsRepo.finishRefund({
        refundId: refund.id,
        paymentId: refund.paymentId,
        amountMinor: refund.amountMinor,
        completedAt: new Date(),
      });
      const booking = await paymentsRepo.findBookingByIdForCancellation(refund.payment.bookingId);
      if (booking) {
        await paymentsRepo.createRefundDebit({
          booking,
          refundId: refund.id,
          amountMinor: refund.amountMinor,
          availableAt: new Date(),
        });
      }
      return { refundId, status: 'SUCCEEDED', gateway: result };
    }
    return { refundId, status: refund.status, gateway: result };
  },

  async reconcilePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        amountMinor: true,
        refundedAmountMinor: true,
        currency: true,
        paidAt: true,
        booking: { select: { id: true, status: true, prepaymentAmountMinor: true } },
      },
    });
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    const gateway = await getFlittOrderStatus(payment.id);
    const expectedAmountMinor = payment.booking.prepaymentAmountMinor ?? payment.amountMinor;
    const identityMatches = gateway.merchantId === env.FLITT_MERCHANT_ID && gateway.currency === payment.currency;
    if (!identityMatches) return { paymentId, status: 'REVIEW_REQUIRED', gateway };

    if (gateway.orderStatus === 'approved' && gateway.actualAmountMinor === expectedAmountMinor) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            amountMinor: gateway.actualAmountMinor,
            paidAt: payment.paidAt ?? new Date(),
            reconciliationRequired: false,
          },
        }),
        prisma.booking.updateMany({
          where: { id: payment.booking.id, status: 'PENDING' },
          data: { status: 'CONFIRMED', depositStatus: 'RECEIVED' },
        }),
      ]);
      return { paymentId, status: 'RESOLVED_PAID', gateway };
    }

    if (gateway.reversalAmountMinor > 0) {
      const reversalDelta = Math.max(0, gateway.reversalAmountMinor - payment.refundedAmountMinor);
      if (reversalDelta > 0) {
        await recordGatewayReversal({ paymentId, amountMinor: reversalDelta });
      } else {
        await prisma.payment.update({ where: { id: paymentId }, data: { reconciliationRequired: false } });
      }
      if (gateway.actualAmountMinor > 0 && gateway.reversalAmountMinor >= gateway.actualAmountMinor) {
        await prisma.booking.updateMany({
          where: { id: payment.booking.id, status: 'PENDING' },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: 'SYSTEM',
            cancellationReason: 'Gateway payment was fully reversed during reconciliation',
          },
        });
      }
      return { paymentId, status: 'RESOLVED_REVERSED', gateway };
    }
    return { paymentId, status: 'REVIEW_REQUIRED', gateway };
  },

  async listPayoutCandidates() {
    const rows = await prisma.masterLedgerEntry.findMany({
      where: { availableAt: { lte: new Date() }, payoutItem: null },
      include: { masterProfile: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return groupPayoutCandidates(rows);
  },

  async listPayouts() {
    return prisma.payout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        masterProfile: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { items: true } },
      },
    });
  },

  async createAdjustment(input: { adminUserId: string; masterProfileId: string; amountMinor: number; reason: string }) {
    return prisma.$transaction(async (tx) => {
      const master = await tx.masterProfile.findUnique({ where: { id: input.masterProfileId }, select: { id: true } });
      if (!master) throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      const draft = await tx.payout.findFirst({
        where: { masterProfileId: input.masterProfileId, status: 'DRAFT' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, amountMinor: true },
      });
      const entry = await tx.masterLedgerEntry.create({
        data: {
          masterProfileId: input.masterProfileId,
          sourceKey: `adjustment:${randomUUID()}`,
          type: 'ADJUSTMENT',
          amountMinor: input.amountMinor,
          currency: 'GEL',
          availableAt: new Date(),
          note: input.reason,
          createdByUserId: input.adminUserId,
        },
      });
      if (draft) {
        const nextAmount = draft.amountMinor + input.amountMinor;
        if (nextAmount > 0) {
          await tx.payoutItem.create({ data: { payoutId: draft.id, ledgerEntryId: entry.id, amountMinor: input.amountMinor } });
          await tx.payout.update({ where: { id: draft.id }, data: { amountMinor: nextAmount } });
        } else {
          await tx.payoutItem.deleteMany({ where: { payoutId: draft.id } });
          await tx.payout.update({ where: { id: draft.id }, data: { amountMinor: 0, status: 'VOID' } });
        }
      }
      return entry;
    });
  },

  async createPayout(adminUserId: string, masterProfileId: string) {
    return prisma.$transaction(async (tx) => {
      const existingDraft = await tx.payout.findFirst({ where: { masterProfileId, status: 'DRAFT' }, select: { id: true } });
      if (existingDraft) throw new ConflictError('A draft payout already exists', 'DRAFT_PAYOUT_EXISTS');
      const entries = await tx.masterLedgerEntry.findMany({
        where: { masterProfileId, availableAt: { lte: new Date() }, payoutItem: null },
        orderBy: { createdAt: 'asc' },
      });
      const amountMinor = entries.reduce((sum, entry) => sum + entry.amountMinor, 0);
      if (amountMinor <= 0) throw new ConflictError('No positive payable balance', 'NO_PAYABLE_BALANCE');
      return tx.payout.create({
        data: {
          masterProfileId,
          amountMinor,
          createdByUserId: adminUserId,
          items: { create: entries.map((entry) => ({ ledgerEntryId: entry.id, amountMinor: entry.amountMinor })) },
        },
        include: { items: true },
      });
    });
  },

  async markPayoutPaid(payoutId: string, transferReference: string, paidAt: Date) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId }, select: { status: true } });
    if (!payout) throw new NotFoundError('Payout not found', 'PAYOUT_NOT_FOUND');
    if (payout.status !== 'DRAFT') throw new ConflictError('Payout is not awaiting payment', 'PAYOUT_NOT_DRAFT');
    const changed = await prisma.payout.updateMany({
      where: { id: payoutId, status: 'DRAFT' },
      data: { status: 'PAID', transferReference, paidAt },
    });
    if (changed.count === 0) throw new ConflictError('Payout is no longer awaiting payment', 'PAYOUT_NOT_DRAFT');
    return prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
  },
};
