import { z } from 'zod';

export const SubscribeSchema = z.object({
  plan: z.enum(['PRO', 'ULTRA']),
  quality: z.enum(['low', 'mid', 'pro']).default('mid'),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
