import { z } from 'zod';

export const RequestVerificationSchema = z.object({
  experienceYears: z.number().int().min(0).max(50).optional(),
});
export type RequestVerificationInput = z.infer<typeof RequestVerificationSchema>;

export const AdminReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().min(1).max(500).optional(),
});
export type AdminReviewInput = z.infer<typeof AdminReviewSchema>;

export const AdminSetBadgeSchema = z.object({
  badge: z.enum(['isCertified', 'isHygieneVerified', 'isQualityProducts', 'isTopRated']),
  granted: z.boolean(),
});
export type AdminSetBadgeInput = z.infer<typeof AdminSetBadgeSchema>;

export const AdminSetTierSchema = z.object({
  tier: z.enum(['JUNIOR', 'INTERMEDIATE', 'PROFESSIONAL', 'TOP_MASTER']),
});
export type AdminSetTierInput = z.infer<typeof AdminSetTierSchema>;

export const AdminGlowStarReviewSchema = z.object({
  action: z.enum(['accept', 'approve', 'reject']),
});
export type AdminGlowStarReviewInput = z.infer<typeof AdminGlowStarReviewSchema>;

export const AdminVerificationUserParamSchema = z.object({
  userId: z.string().uuid(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const VerificationListQuerySchema = PaginationSchema.extend({
  status: z.enum(['NONE', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
});
export type VerificationListQuery = z.infer<typeof VerificationListQuerySchema>;
