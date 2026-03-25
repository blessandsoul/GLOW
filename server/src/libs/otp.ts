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
        from: 'GLOW',
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
      from: 'GLOW',
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
 * Verify an OTP code against the stored hash via gosms.ge.
 * Returns true if the code is valid.
 */
export async function verifyOtp(phone: string, requestId: string, code: string): Promise<boolean> {
  try {
    await gosmsPost('/api/otp/verify', {
      api_key: env.OTP_API_KEY,
      phone: formatPhone(phone),
      hash: requestId,
      code,
    });

    return true;
  } catch (error) {
    handleGoSmsError(error, 'verify');
  }
}
