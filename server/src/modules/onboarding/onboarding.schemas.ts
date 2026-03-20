import { z } from 'zod';

const ServiceItemSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  priceType: z.enum(['fixed', 'hourly']).default('fixed'),
  category: z.string().min(1).max(100),
  duration: z.number().int().min(5).max(480).optional(),
  description: z.string().max(500).optional(),
});

const ConsentsSchema = z.object({
  smsAppointments: z.boolean().default(true),
  smsPromotions: z.boolean().default(true),
  smsNews: z.boolean().default(true),
});

const UserOnboardingSchema = z.object({
  role: z.literal('USER'),
  city: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  interestedCategories: z.array(z.string()).max(20).optional(),
  visitFrequency: z.enum(['biweekly', 'monthly', 'rarely', 'first_time']).optional(),
}).merge(ConsentsSchema);

const MasterOnboardingSchema = z.object({
  role: z.literal('MASTER'),
  city: z.string().min(1).max(100),
  workAddress: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  niches: z.array(z.string().min(1).max(100)).min(1).max(3),
  instagram: z.string().min(1).max(100),
  experienceYears: z.number().int().min(0).max(50),
  experienceMonths: z.number().int().min(0).max(11).default(0),
  services: z.array(ServiceItemSchema).min(1).max(50),
  portfolioItemIds: z.array(z.string().uuid()).min(3).max(50),
}).merge(ConsentsSchema);

const SalonOnboardingSchema = z.object({
  role: z.literal('SALON'),
  salonName: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  workAddress: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  serviceCategories: z.array(z.string()).min(1).max(20),
  portfolioItemIds: z.array(z.string().uuid()).min(1).max(20),
}).merge(ConsentsSchema);

export const CompleteOnboardingSchema = z.discriminatedUnion('role', [
  UserOnboardingSchema,
  MasterOnboardingSchema,
  SalonOnboardingSchema,
]);

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;
