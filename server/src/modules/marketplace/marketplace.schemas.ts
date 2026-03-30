import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'lashes',
  'glue',
  'tweezers',
  'decor',
  'tools',
  'accessories',
  'cosmetics',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const SellerApplySchema = z.object({
  reason: z.string().min(10, 'Minimum 10 characters').max(500, 'Maximum 500 characters'),
});

export const AdminReviewSellerSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().min(1).max(500).optional(),
});

export const CreateProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive().max(99999),
  currency: z.string().default('GEL'),
  category: z.enum(PRODUCT_CATEGORIES),
  inStock: z.boolean().default(true),
  imageUrls: z.array(z.string().min(1).max(1000)).min(1).max(5),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  inStock: z.coerce.boolean().optional(),
  userId: z.string().uuid().optional(),
});

export const AdminSellersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
});

export const ProductParamSchema = z.object({
  id: z.string().uuid(),
});

export const UserParamSchema = z.object({
  userId: z.string().uuid(),
});

export const UsernameParamSchema = z.object({
  username: z.string().min(1),
});

export type SellerApplyInput = z.infer<typeof SellerApplySchema>;
export type AdminReviewSellerInput = z.infer<typeof AdminReviewSellerSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductsQueryInput = z.infer<typeof ProductsQuerySchema>;
