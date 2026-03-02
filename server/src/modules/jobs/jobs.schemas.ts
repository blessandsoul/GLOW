import { z } from 'zod';

export const JobIdParamSchema = z.object({
  jobId: z.string().min(1),
});

export const DownloadQuerySchema = z.object({
  variant: z.coerce.number().int().min(0).default(0),
  branded: z.coerce.number().int().min(0).max(1).default(0),
  upscale: z.coerce.number().int().min(0).max(1).default(0),
});

export const CreateJobSchema = z.object({
  settings: z.string().optional(), // JSON string, parsed server-side
  sessionId: z.string().optional(), // for guest demo tracking
});

export const ListJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'DONE', 'FAILED']).optional(),
});

export const BulkDeleteSchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1).max(50),
});

export const BatchSettingsSchema = z.object({
  settings: z.string().optional(), // JSON string, parsed server-side
});

export const ListResultsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
