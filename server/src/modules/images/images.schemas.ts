import { z } from 'zod';

export const thumbQuerySchema = z.object({
  url: z.string().startsWith('/uploads/'),
  w: z.coerce.number().int().min(16).max(2000).default(128),
});
