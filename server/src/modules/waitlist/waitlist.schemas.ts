import { z } from 'zod';
import { isTbilisiTodayOrFuture } from '@/shared/time/tbilisi.js';

export const WAITLIST_STATUSES = [
  'WAITING',
  'NOTIFIED',
  'CONVERTED',
  'CANCELLED',
  'EXPIRED',
] as const;

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

// Master-driven transitions only (a master never sets WAITING/EXPIRED by hand).
export const MASTER_UPDATABLE_STATUSES = ['NOTIFIED', 'CONVERTED', 'CANCELLED'] as const;

const phone = z.string().regex(/^\+995\d{9}$/, 'Enter a valid Georgian phone (+995XXXXXXXXX)');
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM')
  .optional();

// "Today" is Tbilisi wall-clock (same helper the booking schema + slot generator use),
// so the accept/reject boundary matches the local calendar day rather than UTC's.
const requestedDate = z.coerce.date().refine((d) => isTbilisiTodayOrFuture(d), {
  message: 'Date must be today or in the future',
});

// Body for both request-otp and join (join adds the OTP fields).
const JoinBase = {
  clientName: z.string().min(1, 'Name is required').max(100),
  clientPhone: phone,
  requestedDate,
  serviceName: z.string().min(1).max(100).optional(),
  preferredTime: time,
  note: z.string().max(300).optional(),
  consent: z.literal(true, { message: 'Consent is required' }),
};

export const RequestOtpSchema = z.object(JoinBase);

export const JoinSchema = z.object({
  ...JoinBase,
  otpRequestId: z.string().min(1, 'Missing OTP request id'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const UsernameParamSchema = z.object({
  username: z.string().min(1),
});

export const EntryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const MasterListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(WAITLIST_STATUSES).optional(),
  date: z.coerce.date().optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(MASTER_UPDATABLE_STATUSES),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type JoinInput = z.infer<typeof JoinSchema>;
export type MasterListQueryInput = z.infer<typeof MasterListQuerySchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
