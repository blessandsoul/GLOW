import { z } from 'zod';

export const BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// Master-driven transitions (a master never sets PENDING by hand).
export const MASTER_UPDATABLE_STATUSES = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;

const phone = z.string().regex(/^\+995\d{9}$/, 'Enter a valid Georgian phone (+995XXXXXXXXX)');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM');

const futureDate = z.coerce.date().refine(
  (d) => {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return dayUtc >= todayUtc;
  },
  { message: 'Date must be today or in the future' },
);

export const UsernameParamSchema = z.object({ username: z.string().min(1) });
export const BookingIdParamSchema = z.object({ id: z.string().uuid() });

export const SlotsQuerySchema = z.object({
  date: futureDate,
  serviceName: z.string().min(1).max(100),
});

const BookBase = {
  clientName: z.string().min(1, 'Name is required').max(100),
  clientPhone: phone,
  date: futureDate,
  startTime: time,
  serviceName: z.string().min(1).max(100),
  note: z.string().max(300).optional(),
  consent: z.literal(true, { message: 'Consent is required' }),
};

export const RequestOtpSchema = z.object(BookBase);

export const BookSchema = z.object({
  ...BookBase,
  otpRequestId: z.string().min(1, 'Missing OTP request id'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const MasterListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(BOOKING_STATUSES).optional(),
  date: z.coerce.date().optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(MASTER_UPDATABLE_STATUSES),
});

export type SlotsQueryInput = z.infer<typeof SlotsQuerySchema>;
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type BookInput = z.infer<typeof BookSchema>;
export type MasterListQueryInput = z.infer<typeof MasterListQuerySchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
