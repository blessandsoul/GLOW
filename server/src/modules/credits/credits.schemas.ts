import { z } from 'zod';

export const PurchasePackageSchema = z.object({
  packageId: z.string().min(1),
});

export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['earned', 'spent']).optional(),
});

export type PurchasePackageInput = z.infer<typeof PurchasePackageSchema>;
export type HistoryQueryInput = z.infer<typeof HistoryQuerySchema>;
