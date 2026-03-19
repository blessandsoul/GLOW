import { z } from 'zod';

export const MasterProfileIdParamSchema = z.object({
  masterProfileId: z.string().uuid(),
});

export const PortfolioItemIdParamSchema = z.object({
  portfolioItemId: z.string().uuid(),
});

export const FavoriteStatusQuerySchema = z.object({
  masterIds: z.string().optional(),
  portfolioItemIds: z.string().optional(),
});

export type MasterProfileIdParam = z.infer<typeof MasterProfileIdParamSchema>;
export type PortfolioItemIdParam = z.infer<typeof PortfolioItemIdParamSchema>;
export type FavoriteStatusQuery = z.infer<typeof FavoriteStatusQuerySchema>;
