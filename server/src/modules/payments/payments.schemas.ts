import { z } from 'zod';

export const ManageTokenParamSchema = z.object({ token: z.string().min(32).max(200) });
export const PaymentBookingIdParamSchema = z.object({ id: z.string().uuid() });
export const CancelBookingSchema = z.object({
  reason: z.string().trim().min(1).max(500).default('Cancellation requested'),
});
export const RefundIdParamSchema = z.object({ id: z.string().uuid() });
export const PaymentIdParamSchema = z.object({ id: z.string().uuid() });
export const MasterProfileIdParamSchema = z.object({ masterProfileId: z.string().uuid() });
export const RefundListQuerySchema = z.object({
  status: z.enum(['REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED']).optional(),
});
export const AdminRefundSchema = z.object({
  amountMinor: z.number().int().positive().optional(),
  reason: z.string().trim().min(1).max(500),
});
export const AdminAdjustmentSchema = z.object({
  amountMinor: z.number().int().refine((value) => value !== 0, 'Adjustment cannot be zero'),
  reason: z.string().trim().min(1).max(500),
});
export const MarkPayoutPaidSchema = z.object({
  transferReference: z.string().trim().min(1).max(191),
  paidAt: z.coerce.date().refine((value) => value.getTime() <= Date.now() + 5 * 60 * 1000, 'Paid date cannot be in the future'),
});
