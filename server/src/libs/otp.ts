import { OtpClient, OtpChannel, InvalidOtpError, OtpExpiredError, RateLimitError } from '@smart-pay-chain/otp';
import { env } from '@/config/env.js';
import { BadRequestError } from '@/shared/errors/errors.js';
import { logger } from '@/libs/logger.js';

const OTP_TTL = 300; // 5 minutes
const OTP_LENGTH = 6;

const client = new OtpClient({
  apiKey: env.OTP_API_KEY,
  autoConfig: true,
});

/**
 * Send an SMS OTP to the given phone number.
 * Returns the requestId needed for verification.
 */
export async function sendOtp(phoneNumber: string): Promise<{ requestId: string }> {
  try {
    const result = await client.sendOtp({
      phoneNumber,
      channel: OtpChannel.SMS,
      ttl: OTP_TTL,
      length: OTP_LENGTH,
    });

    return { requestId: result.requestId };
  } catch (error) {
    if (error instanceof InvalidOtpError) {
      throw new BadRequestError('Invalid verification code', 'INVALID_OTP');
    }
    if (error instanceof OtpExpiredError) {
      throw new BadRequestError('Verification code has expired', 'OTP_EXPIRED');
    }
    if (error instanceof RateLimitError) {
      throw new BadRequestError('Too many attempts, please try again later', 'OTP_RATE_LIMIT');
    }

    logger.error({ err: error, phoneNumber }, 'Failed to send OTP');
    throw new BadRequestError('Failed to send verification code', 'OTP_SEND_FAILED');
  }
}

/**
 * Verify an OTP code against a requestId.
 * Returns true if the code is valid.
 */
export async function verifyOtp(requestId: string, code: string, ipAddress: string): Promise<boolean> {
  try {
    await client.verifyOtp({
      requestId,
      code,
      ipAddress,
    });

    // SDK throws on failure (InvalidOtpError, OtpExpiredError, etc.)
    // If no error was thrown, verification succeeded
    return true;
  } catch (error) {
    if (error instanceof InvalidOtpError) {
      throw new BadRequestError('Invalid verification code', 'INVALID_OTP');
    }
    if (error instanceof OtpExpiredError) {
      throw new BadRequestError('Verification code has expired', 'OTP_EXPIRED');
    }
    if (error instanceof RateLimitError) {
      throw new BadRequestError('Too many attempts, please try again later', 'OTP_RATE_LIMIT');
    }

    logger.error({ err: error, requestId }, 'Failed to verify OTP');
    throw new BadRequestError('Failed to verify code', 'OTP_VERIFY_FAILED');
  }
}
