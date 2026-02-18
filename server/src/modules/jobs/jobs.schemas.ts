import { z } from 'zod';

export const JobIdParamSchema = z.object({
  jobId: z.string().min(1),
});

export const DownloadQuerySchema = z.object({
  variant: z.coerce.number().int().min(0).default(0),
});
