import { z } from 'zod';

export const ShowcaseParamSchema = z.object({
  jobId: z.string().min(1),
});

export const SubmitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
  clientName: z.string().max(100).optional(),
});

export type ShowcaseParam = z.infer<typeof ShowcaseParamSchema>;
export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;
