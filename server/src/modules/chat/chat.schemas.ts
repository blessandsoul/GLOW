import { z } from 'zod';

// Max 500 chars, strip HTML/control chars for prompt injection protection
export const SendChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long (max 500 characters)')
    .transform((val) => val.replace(/<[^>]*>/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim()),
  language: z.enum(['ru', 'ka']).default('ru'),
});

export type SendChatMessageInput = z.infer<typeof SendChatMessageSchema>;
