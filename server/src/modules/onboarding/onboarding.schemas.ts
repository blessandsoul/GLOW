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

function isAdult(dateStr: string): boolean {
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age >= 18;
}

const ModelOnboardingSchema = z.object({
  role: z.literal('MODEL'),
  displayName: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  birthDate: z.string().refine(isAdult, 'You must be at least 18 years old'),
  niches: z.array(z.string().min(1).max(100)).max(10).optional(),
  bio: z.string().max(1000).optional(),
  phone: z.string().regex(/^\+995\d{9}$/).optional(),
  instagram: z.string().max(100).optional(),
  consent: z.literal(true, { message: 'Model-release consent is required' }),
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
  ModelOnboardingSchema,
]);

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;
