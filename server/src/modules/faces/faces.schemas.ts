import { z } from 'zod';

export const ModelIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const PhotoIdParamSchema = z.object({
  photoId: z.string().uuid(),
});

export const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const CatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  niche: z.string().max(100).optional(),
  search: z.string().max(100).optional(),
});

export const UpdateModelProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  districtId: z.string().uuid().nullable().optional(),
  heightCm: z.number().int().min(120).max(220).nullable().optional(),
  measurements: z.string().max(60).nullable().optional(),
  hairColor: z.string().max(40).nullable().optional(),
  eyeColor: z.string().max(40).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  niches: z.array(z.string().min(1).max(100)).max(10).optional(),
  phone: z.string().regex(/^\+995\d{9}$/).nullable().optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  telegram: z.string().max(100).nullable().optional(),
  instagram: z.string().max(100).nullable().optional(),
});

export const AdminReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().min(1).max(500).optional(),
});

export const PhotoReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const InterestStatusQuerySchema = z.object({
  modelIds: z.string().optional(),
});

export const AdminPendingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CatalogQueryInput = z.infer<typeof CatalogQuerySchema>;
export type UpdateModelProfileInput = z.infer<typeof UpdateModelProfileSchema>;
export type AdminReviewInput = z.infer<typeof AdminReviewSchema>;
export type PhotoReviewInput = z.infer<typeof PhotoReviewSchema>;
