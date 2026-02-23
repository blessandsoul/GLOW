import { z } from 'zod';

export const PurchasePackageSchema = z.object({
  packageId: z.string().min(1),
});

export type PurchasePackageInput = z.infer<typeof PurchasePackageSchema>;
