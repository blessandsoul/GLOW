import { z } from 'zod';

export const CreateReviewSchema = z.object({
  masterId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().max(1000).optional(),
});

export const ReviewParamSchema = z.object({
  reviewId: z.string().uuid(),
});

export const MasterReviewsParamSchema = z.object({
  masterId: z.string().uuid(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
