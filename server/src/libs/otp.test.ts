import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the fail-closed verifyOtp gate against the gosms.ge /api/otp/verify contract.
// The bug: gosms returns HTTP 200 even for a hash it never issued and for a wrong code,
// so verifyOtp must require an EXPLICIT positive flag in the BODY, not just a 2xx status.
vi.mock('./logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { verifyOtp } from './otp.js';

const PHONE = '+995555123456';
const HASH = 'issued-hash';
const CODE = '123456';

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('verifyOtp — fail-closed against gosms /api/otp/verify', () => {
  it('accepts an explicit success:true body', async () => {
    mockFetch(200, { success: true });
    await expect(verifyOtp(PHONE, HASH, CODE)).resolves.toBe(true);
  });

  it('accepts an explicit verified:true body', async () => {
    mockFetch(200, { verified: true });
    await expect(verifyOtp(PHONE, HASH, CODE)).resolves.toBe(true);
  });

  it('accepts an explicit status:"verified" body', async () => {
    mockFetch(200, { status: 'verified' });
    await expect(verifyOtp(PHONE, HASH, CODE)).resolves.toBe(true);
  });

  // ── The exploit cases: HTTP 200 with NO explicit positive flag must be rejected ──

  it('REJECTS a 200 with an empty body (unknown-hash / wrong-code no-op)', async () => {
    mockFetch(200, {});
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  it('REJECTS a 200 body that echoes the send shape but never confirms verification', async () => {
    // gosms /api/otp/verify returning the send-style { hash } with no success flag.
    mockFetch(200, { hash: 'issued-hash' });
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  it('REJECTS an explicit success:false even on a 200', async () => {
    mockFetch(200, { success: false });
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  it('REJECTS a 200 carrying an errorCode (error indicator vetoes any positive)', async () => {
    mockFetch(200, { success: true, errorCode: 112 });
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  it('REJECTS an unknown status string', async () => {
    mockFetch(200, { status: 'pending' });
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  // ── Non-2xx gosms errorCode path still maps to a typed error ──

  it('maps the gosms 112 wrong-code error (non-2xx) to INVALID_OTP', async () => {
    mockFetch(400, { errorCode: 112, message: 'Invalid code' });
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  it('maps the gosms 111 expired error (non-2xx) to OTP_EXPIRED', async () => {
    mockFetch(400, { errorCode: 111, message: 'Expired' });
    await expect(verifyOtp(PHONE, HASH, CODE)).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  });
});
