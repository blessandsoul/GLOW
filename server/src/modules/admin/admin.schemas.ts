import { z } from 'zod';

export const AdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
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

export const AdminPortfoliosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type AdminPortfoliosQuery = z.infer<typeof AdminPortfoliosQuerySchema>;

export const portfolioItemsParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const portfolioItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export type PortfolioItemsParams = z.infer<typeof portfolioItemsParamsSchema>;
export type PortfolioItemsQuery = z.infer<typeof portfolioItemsQuerySchema>;

export const BulkSmsBodySchema = z.object({
  message: z.string().min(1, 'Message is required').max(800, 'Message too long'),
  mode: z.enum(['all', 'custom']),
  phoneNumbers: z
    .array(z.string().regex(/^(\+?995)?\d{9}$/, 'Invalid Georgian phone format'))
    .max(10000, 'Too many phone numbers')
    .optional(),
}).refine(
  (data) => data.mode === 'all' || (data.phoneNumbers && data.phoneNumbers.length > 0),
  { message: 'Phone numbers are required in custom mode', path: ['phoneNumbers'] },
);

export type BulkSmsBody = z.infer<typeof BulkSmsBodySchema>;
