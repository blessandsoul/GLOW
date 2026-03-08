import { z } from 'zod';

export const ReportProblemSchema = z.object({
  phone: z
    .string()
    .min(5, 'Phone number is required')
    .max(20, 'Phone number too long')
    .transform((val) => val.replace(/[^\d+\-() ]/g, '').trim()),
  jobId: z.string().max(100).optional(),
});

export type ReportProblemInput = z.infer<typeof ReportProblemSchema>;
