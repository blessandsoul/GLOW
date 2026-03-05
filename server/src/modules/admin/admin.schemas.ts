import { z } from 'zod';

export const AdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

export const userImagesParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const userImagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export type UserImagesParams = z.infer<typeof userImagesParamsSchema>;
export type UserImagesQuery = z.infer<typeof userImagesQuerySchema>;
