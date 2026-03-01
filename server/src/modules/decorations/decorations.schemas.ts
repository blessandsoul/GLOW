import { z } from 'zod';

export const SuggestDecorationsBodySchema = z.object({
  niche: z.enum(['hair', 'eyes', 'lips', 'nails', 'skin', 'general']).default('general'),
});

export type SuggestDecorationsBody = z.infer<typeof SuggestDecorationsBodySchema>;
