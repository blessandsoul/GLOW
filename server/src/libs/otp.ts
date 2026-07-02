import { env } from '@/config/env.js';
import { BadRequestError, InternalError } from '@/shared/errors/errors.js';
import { logger } from '@/libs/logger.js';

const GOSMS_BASE_URL = 'https://api.gosms.ge';

interface GoSmsOtpSendResponse {
  success: boolean;
  hash: string;
}

interface GoSmsErrorResponse {
  errorCode: number;
  message: string;
}

/**
 * gosms.ge /api/otp/verify response body.
 *
 * ASSUMED CONTRACT (needs a real-gateway confirmation — see verifyOtp).
 * A live pentest proved gosms returns HTTP 200 even for a hash it never issued and
 * for a WRONG code, so the transport status is NOT a trust signal for verification.
 * We therefore require an EXPLICIT positive flag in the body. gosms is not consistent
 * across its endpoints about which key it uses, so we fail-closed unless one of the
 * known positive shapes is explicitly truthy:
 *   - success: true
 *   - verified: true
 *   - status: "verified" | "success" | "ok"
 * Any other body (missing/false flag, an errorCode, an unknown shape) = verification
 * FAILURE. All fields optional because we treat their ABSENCE as failure, not success.
 */
interface GoSmsOtpVerifyResponse {
  success?: boolean;
  verified?: boolean;
  status?: string;
  errorCode?: number;
  message?: string;
}

function formatPhone(phoneNumber: string): string {
  // gosms.ge expects "995XXXXXXXXX" — strip leading "+" if present
  return phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
}

async function gosmsPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${GOSMS_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T | GoSmsErrorResponse;

  if (!response.ok) {
    const err = data as GoSmsErrorResponse;
    throw { isGoSmsError: true, errorCode: err.errorCode, message: err.message };
  }

  return data as T;
}

function handleGoSmsError(error: unknown, context: 'send' | 'verify'): never {
  const isGoSmsError =
    typeof error === 'object' &&
    error !== null &&
    (error as Record<string, unknown>).isGoSmsError === true;

  if (isGoSmsError) {
    const { errorCode } = error as { errorCode: number };
    switch (errorCode) {
      case 109:
        throw new BadRequestError('Too many attempts, please try again later', 'OTP_RATE_LIMIT');
      case 111:
        throw new BadRequestError('Verification code has expired', 'OTP_EXPIRED');
      case 112:
        throw new BadRequestError('Invalid verification code', 'INVALID_OTP');
      case 105:
        throw new BadRequestError('Invalid phone number', 'INVALID_PHONE');
      case 100:
        logger.error({ errorCode }, 'gosms.ge API key invalid');
        throw new InternalError('OTP service configuration error', 'OTP_CONFIG_ERROR');
      default:
        logger.error({ errorCode }, `Failed to ${context} OTP`);
        throw new BadRequestError(
          context === 'send' ? 'Failed to send verification code' : 'Failed to verify code',
          context === 'send' ? 'OTP_SEND_FAILED' : 'OTP_VERIFY_FAILED',
        );
    }
  }

  logger.error({ err: error }, `Unexpected error during OTP ${context}`);
  throw new BadRequestError(
    context === 'send' ? 'Failed to send verification code' : 'Failed to verify code',
    context === 'send' ? 'OTP_SEND_FAILED' : 'OTP_VERIFY_FAILED',
  );
}

interface GoSmsBulkResponse {
  success: boolean;
  message?: string;
  sent?: number;
  failed?: number;
  errors?: string[];
}

const BULK_BATCH_SIZE = 1000;

/**
 * Send an SMS to multiple phone numbers via gosms.ge bulk endpoint.
 * Batches into groups of 1000 (API limit per request).
 */
export async function sendBulkSms(
  phoneNumbers: string[],
  message: string,
): Promise<{ totalSent: number; totalFailed: number; errors: string[] }> {
  const formatted = phoneNumbers.map(formatPhone);
  let totalSent = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (let i = 0; i < formatted.length; i += BULK_BATCH_SIZE) {
    const batch = formatted.slice(i, i + BULK_BATCH_SIZE);
    const batchIndex = Math.floor(i / BULK_BATCH_SIZE) + 1;

    try {
      const response = await gosmsPost<GoSmsBulkResponse>('/api/sendbulk', {
        api_key: env.OTP_API_KEY,
        from: env.SMS_SENDER_ID,
        to: batch,
        text: message,
      });

      const sent = response.sent ?? batch.length;
      const failed = response.failed ?? 0;
      totalSent += sent;
      totalFailed += failed;

      if (response.errors) {
        errors.push(...response.errors);
      }

      logger.info({ batchIndex, batchSize: batch.length, sent, failed }, 'Bulk SMS batch sent');
    } catch (error) {
      totalFailed += batch.length;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Batch ${batchIndex} failed: ${errMsg}`);
      logger.error({ batchIndex, batchSize: batch.length, err: error }, 'Bulk SMS batch failed');
    }
  }

  return { totalSent, totalFailed, errors };
}

/**
 * Send a single SMS to a phone number via gosms.ge.
 * Fire-and-forget — logs errors but does not throw.
 */
export async function sendSms(phoneNumber: string, message: string): Promise<void> {
  try {
    await gosmsPost('/api/sendbulk', {
      api_key: env.OTP_API_KEY,
      from: env.SMS_SENDER_ID,
      to: [formatPhone(phoneNumber)],
      text: message,
    });
    logger.info({ phone: phoneNumber }, 'SMS notification sent');
  } catch (error) {
    logger.error({ phone: phoneNumber, err: error }, 'Failed to send SMS notification');
  }
}

/**
 * Send an SMS OTP to the given phone number via gosms.ge.
 * Returns the hash needed for verification (stored as otpRequestId).
 */
export async function sendOtp(phoneNumber: string): Promise<{ requestId: string }> {
  if (env.NODE_ENV === 'development') {
    logger.info({ phone: phoneNumber }, 'OTP send bypassed in development mode');
    return { requestId: 'dev-request-id' };
  }
  try {
    const response = await gosmsPost<GoSmsOtpSendResponse>('/api/otp/send', {
      api_key: env.OTP_API_KEY,
      phone: formatPhone(phoneNumber),
    });

    return { requestId: response.hash };
  } catch (error) {
    handleGoSmsError(error, 'send');
  }
}

/**
 * FAIL-CLOSED gate over the gosms.ge verify body.
 *
 * Returns true ONLY when the body carries an EXPLICIT positive verification flag and
 * carries no error indicator. Everything else — a missing flag, `success:false`, an
 * `errorCode`, or an unrecognized shape — returns false so the caller rejects the code.
 * See GoSmsOtpVerifyResponse for the assumed contract.
 */
function isGoSmsVerifySuccess(body: GoSmsOtpVerifyResponse): boolean {
  // An explicit failure/error indicator vetoes success outright.
  if (body.success === false) return false;
  if (typeof body.errorCode === 'number') return false;

  const status = typeof body.status === 'string' ? body.status.toLowerCase() : '';
  return (
    body.success === true ||
    body.verified === true ||
    status === 'verified' ||
    status === 'success' ||
    status === 'ok'
  );
}

/**
 * Verify an OTP code against the stored hash via gosms.ge.
 * Returns true only if gosms explicitly confirms the code is valid.
 *
 * SECURITY (fail-closed): gosms /api/otp/verify returns HTTP 200 even for a hash it
 * never issued and for a wrong code, so a non-throwing response is NOT proof of a
 * valid code (this was the account-takeover bug). We parse the response BODY and
 * require an explicit positive verification flag (see isGoSmsVerifySuccess); a missing
 * or false flag, or an unknown-hash response, is treated as verification FAILURE and
 * raises the same typed INVALID_OTP error as the wrong-code path.
 *
 * NOTE: the exact success field gosms returns is UNCONFIRMED against a live gateway —
 * this accepts any of the known positive shapes and fails closed on everything else.
 * Confirm the real field on a live gosms.ge verify round-trip and tighten if needed.
 */
export async function verifyOtp(phone: string, requestId: string, code: string): Promise<boolean> {
  if (env.NODE_ENV === 'development' && code === '123456') {
    logger.info({ phone }, 'OTP verification bypassed in development mode');
    return true;
  }
  let body: GoSmsOtpVerifyResponse;
  try {
    body = await gosmsPost<GoSmsOtpVerifyResponse>('/api/otp/verify', {
      api_key: env.OTP_API_KEY,
      phone: formatPhone(phone),
      hash: requestId,
      code,
    });
  } catch (error) {
    // Non-2xx (gosms errorCode path, e.g. 111 expired / 112 invalid code) → typed error.
    handleGoSmsError(error, 'verify');
  }

  if (!isGoSmsVerifySuccess(body)) {
    // HTTP 200 but no explicit positive flag (or an unknown-hash / wrong-code body).
    // Fail closed with the same error the gosms 112 wrong-code path raises.
    logger.warn(
      { phone, hasSuccess: body.success, hasVerified: body.verified, status: body.status, errorCode: body.errorCode },
      'gosms verify returned no explicit success flag — rejecting OTP',
    );
    throw new BadRequestError('Invalid verification code', 'INVALID_OTP');
  }

  return true;
}
