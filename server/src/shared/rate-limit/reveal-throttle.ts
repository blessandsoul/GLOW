import { redis } from '@/libs/redis.js';
import { logger } from '@/libs/logger.js';
import { BadRequestError } from '@/shared/errors/errors.js';

// Contact-reveal throttle. Expressing interest in a model (a "like") unlocks that model's
// private contact details for the master. With no cap, one master can like every model in
// the catalog and harvest every private phone/whatsapp/telegram/instagram in seconds. This
// bounds how many *new* reveals a single master can perform per rolling window, keyed by the
// master's user id (not IP), so it holds across sessions/devices.

const MAX_REVEALS_PER_WINDOW = 30;
const WINDOW_SECONDS = 60 * 60; // 1 hour

/**
 * Fixed-window per-master reveal counter (INCR + EXPIRE-on-first-hit). Throws
 * CONTACT_REVEAL_THROTTLED once the cap is exceeded. Fail-open on a Redis error.
 */
export async function assertContactRevealAllowed(userId: string): Promise<void> {
  const key = `faces:reveal:${userId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }
    if (count > MAX_REVEALS_PER_WINDOW) {
      throw new BadRequestError(
        'You have viewed too many contacts recently. Please try again later.',
        'CONTACT_REVEAL_THROTTLED',
      );
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error({ err, userId }, 'Contact-reveal throttle check failed (Redis) — failing open');
  }
}
