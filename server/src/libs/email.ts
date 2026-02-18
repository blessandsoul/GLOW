import { Resend } from 'resend';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    logger.info({ to, subject }, 'Email sent');
  } catch (err) {
    logger.error({ err, to }, 'Failed to send email — non-fatal');
    // intentionally not re-throwing: email failures must not break the API response
  }
}
