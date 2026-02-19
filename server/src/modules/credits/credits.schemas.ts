import { z } from 'zod';

export const PurchasePackageSchema = z.object({
  packageId: z.string().uuid(),
});

export type PurchasePackageInput = z.infer<typeof PurchasePackageSchema>;
