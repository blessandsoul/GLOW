import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { BadRequestError } from '@shared/errors/errors.js';

// In-memory rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000 * 5; // 5 minutes
const RATE_LIMIT_MAX = 3; // 3 reports per 5 minutes

function checkRateLimit(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    throw new BadRequestError('Too many reports. Please wait a few minutes.', 'RATE_LIMITED');
  }

  entry.count++;
}

// Cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

export const notificationsService = {
  async reportProblem(phone: string, clientIp: string, jobId?: string): Promise<void> {
    checkRateLimit(clientIp);

    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      logger.warn('Telegram credentials not configured, skipping report notification');
      return;
    }

    const jobLine = jobId ? `\n📋 Job ID: \`${jobId}\`` : '';
    const text = `🚨 *Problem Report*\n\n📱 Phone: \`${phone}\`${jobLine}\n🌐 IP: \`${clientIp}\`\n🕐 ${new Date().toISOString()}`;

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        logger.error({ status: response.status, body }, 'Telegram API error');
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to send Telegram notification');
    }
  },
};
