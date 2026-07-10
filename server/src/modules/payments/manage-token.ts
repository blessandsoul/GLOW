import crypto from 'node:crypto';
import { env } from '@/config/env.js';

export function createBookingManageToken(bookingId: string): string {
  const signature = crypto.createHmac('sha256', env.JWT_SECRET).update(bookingId, 'utf8').digest('base64url');
  return `${bookingId}.${signature}`;
}

export function hashBookingManageToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
