import { z } from 'zod';

export const GenerateCaptionParamsSchema = z.object({
  jobId: z.string().min(1),
});

export const GenerateCaptionQuerySchema = z.object({
  force: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});
