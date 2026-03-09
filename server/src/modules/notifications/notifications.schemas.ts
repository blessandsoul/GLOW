import { z } from 'zod';

export const ReportProblemSchema = z.object({
  phone: z
    .string()
    .min(5, 'Phone number is required')
    .max(20, 'Phone number too long')
    .transform((val) => val.replace(/[^\d+\-() ]/g, '').trim()),
  message: z
    .string()
    .min(3, 'Please describe the problem')
    .max(1000, 'Message too long')
    .transform((val) => val.trim()),
  jobId: z.string().max(100).optional(),
});

export type ReportProblemInput = z.infer<typeof ReportProblemSchema>;
