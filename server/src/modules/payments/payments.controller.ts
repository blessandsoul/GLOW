import type { FastifyReply, FastifyRequest } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { PaymentsService } from './payments.service.js';
import { paymentOperationsService } from './payment-operations.service.js';
import {
  AdminRefundSchema,
  AdminAdjustmentSchema,
  CancelBookingSchema,
  ManageTokenParamSchema,
  MarkPayoutPaidSchema,
  MasterProfileIdParamSchema,
  PaymentBookingIdParamSchema,
  PaymentIdParamSchema,
  RefundIdParamSchema,
  RefundListQuerySchema,
} from './payments.schemas.js';

export function createPaymentsController(service: PaymentsService) {
  return {
    async getManagedBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { token } = ManageTokenParamSchema.parse(request.params);
      reply.send(successResponse('Booking retrieved', await service.getManagedBooking(token)));
    },

    async cancelManagedBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { token } = ManageTokenParamSchema.parse(request.params);
      const { reason } = CancelBookingSchema.parse(request.body ?? {});
      reply.send(successResponse('Booking cancelled', await service.cancelByManageToken(token, reason)));
    },

    async cancelMasterBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PaymentBookingIdParamSchema.parse(request.params);
      const { reason } = CancelBookingSchema.parse(request.body ?? {});
      reply.send(successResponse('Booking cancelled', await service.cancelBooking({
        bookingId: id,
        actor: 'MASTER',
        actorUserId: request.user!.id,
        reason,
      })));
    },

    async markNoShow(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PaymentBookingIdParamSchema.parse(request.params);
      reply.send(successResponse('Booking marked no-show', await service.cancelBooking({
        bookingId: id,
        actor: 'NO_SHOW',
        actorUserId: request.user!.id,
        reason: 'Client did not attend',
      })));
    },

    async masterBalance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      reply.send(successResponse('Balance retrieved', await paymentOperationsService.getMasterBalance(request.user!.id)));
    },

    async adminRefunds(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { status } = RefundListQuerySchema.parse(request.query);
      reply.send(successResponse('Refunds retrieved', await paymentOperationsService.listRefunds(status)));
    },

    async adminPayments(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      reply.send(successResponse('Payments retrieved', await paymentOperationsService.listPayments()));
    },

    async adminCreateRefund(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PaymentIdParamSchema.parse(request.params);
      const { amountMinor, reason } = AdminRefundSchema.parse(request.body);
      reply.status(201).send(successResponse('Refund initiated', await paymentOperationsService.createAdminRefund(request.user!.id, id, amountMinor, reason)));
    },

    async adminCancelBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PaymentBookingIdParamSchema.parse(request.params);
      const { reason } = CancelBookingSchema.parse(request.body ?? {});
      reply.send(successResponse('Booking cancelled', await service.cancelBooking({
        bookingId: id,
        actor: 'ADMIN',
        actorUserId: request.user!.id,
        reason,
      })));
    },

    async adminRetryRefund(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = RefundIdParamSchema.parse(request.params);
      reply.send(successResponse('Refund retried', await paymentOperationsService.retryRefund(id)));
    },

    async adminReconcileRefund(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = RefundIdParamSchema.parse(request.params);
      reply.send(successResponse('Refund reconciled', await paymentOperationsService.reconcileRefund(id)));
    },

    async adminReconcilePayment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = PaymentIdParamSchema.parse(request.params);
      reply.send(successResponse('Payment reconciled', await paymentOperationsService.reconcilePayment(id)));
    },

    async adminPayoutCandidates(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      reply.send(successResponse('Payout candidates retrieved', await paymentOperationsService.listPayoutCandidates()));
    },

    async adminPayouts(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      reply.send(successResponse('Payouts retrieved', await paymentOperationsService.listPayouts()));
    },

    async adminCreateAdjustment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { masterProfileId } = MasterProfileIdParamSchema.parse(request.params);
      const { amountMinor, reason } = AdminAdjustmentSchema.parse(request.body);
      reply.status(201).send(successResponse('Ledger adjustment created', await paymentOperationsService.createAdjustment({
        adminUserId: request.user!.id,
        masterProfileId,
        amountMinor,
        reason,
      })));
    },

    async adminCreatePayout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { masterProfileId } = MasterProfileIdParamSchema.parse(request.params);
      reply.status(201).send(successResponse('Payout created', await paymentOperationsService.createPayout(request.user!.id, masterProfileId)));
    },

    async adminMarkPayoutPaid(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = RefundIdParamSchema.parse(request.params);
      const { transferReference, paidAt } = MarkPayoutPaidSchema.parse(request.body);
      reply.send(successResponse('Payout marked paid', await paymentOperationsService.markPayoutPaid(id, transferReference, paidAt)));
    },
  };
}
