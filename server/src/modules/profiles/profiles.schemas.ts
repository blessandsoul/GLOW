import { z } from 'zod';

const ServiceItemSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
  priceType: z.enum(['fixed', 'hourly']).default('fixed'),
  category: z.string().min(1, 'Category is required').max(100),
  duration: z.number().int().min(5).max(480).optional(),
  description: z.string().max(500).optional(),
});

const TimeSlotSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
});

const DayScheduleSchema = z.array(TimeSlotSchema).max(4).nullable();

const WorkingHoursSchema = z.object({
  monday: DayScheduleSchema,
  tuesday: DayScheduleSchema,
  wednesday: DayScheduleSchema,
  thursday: DayScheduleSchema,
  friday: DayScheduleSchema,
  saturday: DayScheduleSchema,
  sunday: DayScheduleSchema,
});

export const UpdateProfileSchema = z.object({
  city: z.string().max(100).optional(),
  niche: z.string().max(100).optional(),
  workAddress: z.string().max(500).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  telegram: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  services: z.array(ServiceItemSchema).max(50).optional(),
  languages: z.array(z.string().max(5)).max(10).optional(),
  locationType: z.enum(['salon', 'home_studio', 'mobile', 'client_visit']).optional(),
  districtId: z.string().uuid().optional().nullable(),
  workingHours: WorkingHoursSchema.optional().nullable(),
  brandIds: z.array(z.string().uuid()).max(20).optional(),
  styleTagIds: z.array(z.string().uuid()).max(20).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
