import { z } from 'zod';

export const CreatePortfolioItemSchema = z.object({
  imageUrl: z.string().url().max(1000),
  title: z.string().max(200).optional(),
  niche: z.string().max(100).optional(),
  isPublished: z.boolean().default(true),
  jobId: z.string().uuid().optional(),
});

export type CreatePortfolioItemInput = z.infer<typeof CreatePortfolioItemSchema>;

export const UpdatePortfolioItemSchema = z.object({
  title: z.string().max(200).optional(),
  niche: z.string().max(100).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdatePortfolioItemInput = z.infer<typeof UpdatePortfolioItemSchema>;

export const PortfolioItemIdSchema = z.object({
  id: z.string().uuid(),
});

export const PublicPortfolioParamsSchema = z.object({
  username: z.string().min(1).max(100),
});
