import { z } from 'zod';

export const WATERMARK_STYLES = [
  'MINIMAL',
  'FRAMED',
  'STORIES_TEMPLATE',
  'DIAGONAL',
  'BADGE',
  'SPLIT',
] as const;

export const UpdateBrandingSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100),
  instagramHandle: z.string().max(100).optional().default(''),
  facebookHandle: z.string().max(100).optional().default(''),
  tiktokHandle: z.string().max(100).optional().default(''),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').default('#d4738a'),
  watermarkStyle: z.enum(WATERMARK_STYLES).default('MINIMAL'),
  watermarkOpacity: z.coerce.number().min(0).max(1).default(1),
});

export type UpdateBrandingInput = z.infer<typeof UpdateBrandingSchema>;

export const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
