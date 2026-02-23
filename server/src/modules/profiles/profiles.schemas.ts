import { z } from 'zod';

const ServiceItemSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().min(1).max(10).default('GEL'),
  category: z.string().min(1, 'Category is required').max(100),
});

export const UpdateProfileSchema = z.object({
  city: z.string().max(100).optional(),
  niche: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  telegram: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  services: z.array(ServiceItemSchema).max(50).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
