import { z } from 'zod';

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const DeleteAccountSchema = z.object({
  otpRequestId: z.string().min(1, 'OTP request ID is required'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;

export const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
