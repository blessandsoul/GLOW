import { redis } from '@/libs/redis.js';
import { logger } from '@/libs/logger.js';
import { BadRequestError } from '@/shared/errors/errors.js';

// Per-phone OTP throttle. The Fastify per-route rate-limit is per-IP, so a single caller
// rotating IPs (or many callers) can still fan real SMS out to arbitrary phone numbers
// (an SMS-bomb / cost-drain vector, since each OTP is a paid gosms.ge send). This caps the
// number of OTP sends to any ONE phone number within a rolling window, keyed by the target
// number rather than the requester's IP.

const MAX_OTP_PER_PHONE = 5;
const WINDOW_SECONDS = 60 * 60; // 1 hour

/**
 * Fixed-window counter per phone (INCR + EXPIRE-on-first-hit). Throws OTP_PHONE_THROTTLED
 * once the cap is exceeded. Fail-open: if Redis is unreachable, the per-IP route limit and
 * gosms.ge's own per-number limits (error 109) still apply, so an OTP is not blocked on an
 * infra hiccup.
 *
 * @param scope a short namespace ("booking" | "waitlist") so the two flows don't share a bucket.
 */
export async function assertOtpPhoneAllowed(scope: string, phone: string): Promise<void> {
  const key = `otp:throttle:${scope}:${phone}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }
    if (count > MAX_OTP_PER_PHONE) {
      throw new BadRequestError(
        'Too many verification codes requested for this number. Please try again later.',
        'OTP_PHONE_THROTTLED',
      );
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err; // the throttle decision itself
    logger.error({ err, scope }, 'OTP phone throttle check failed (Redis) — failing open');
  }
}
