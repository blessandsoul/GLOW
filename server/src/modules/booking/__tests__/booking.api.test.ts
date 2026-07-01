import { describe, it, expect, beforeAll } from 'vitest';
import {
  api,
  login,
  ADMIN,
  USER,
  MASTER,
  MASTER_USERNAME,
  MASTER_SERVICE,
  assertErrorEnvelope,
  type Jar,
} from '@/test/api/harness.js';

// Seeded master `nino-lashes` has bookingEnabled=false (schema default, not set in seed),
// so the public booking flow returns BOOKING_DISABLED before any slot/OTP work. We test
// every reachable path: param/query validation (runs first, in the controller), the
// disabled-master error, unknown-username, and the master-facing auth/IDOR surface.
const B = '/booking';
const pub = (p: string): string => `${B}/public/${MASTER_USERNAME}${p}`;

// A far-future date for slot/otp bodies (schema requires today-or-future).
const FUTURE = '2099-07-14';
const PAST = '2000-01-01';

function bookBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    clientName: 'Api Tester',
    clientPhone: '+995500000001',
    date: FUTURE,
    startTime: '14:00',
    serviceName: MASTER_SERVICE,
    consent: true,
    ...over,
  };
}

let masterJar: Jar;
let userJar: Jar;
let adminJar: Jar;

beforeAll(async () => {
  masterJar = await login(MASTER);
  userJar = await login(USER);
  adminJar = await login(ADMIN);
});

describe('booking public GET /services', () => {
  it('unknown username → 404 MASTER_NOT_FOUND', async () => {
    const res = await api('GET', `${B}/public/__nope_apitest__/services`);
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('MASTER_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  // nino-lashes is now bookingEnabled=true (re-seeded), so the public booking flow is LIVE.
  it('booking-enabled master → 200 with services + payment info', async () => {
    const res = await api('GET', pub('/services'));
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.username).toBe(MASTER_USERNAME);
    expect(Array.isArray(res.body?.data?.services)).toBe(true);
    expect(res.body?.data?.services.length).toBeGreaterThan(0);
    expect(res.body?.data).toHaveProperty('paymentMode');
  });
});

describe('booking public GET /slots — query validation (runs before service)', () => {
  it('missing date+serviceName → 422 VALIDATION_FAILED', async () => {
    const res = await api('GET', pub('/slots'));
    expect(res.status).toBe(422);
    expect(res.body?.error?.code).toBe('VALIDATION_FAILED');
    assertErrorEnvelope(res);
  });

  it('missing serviceName only → 422', async () => {
    const res = await api('GET', pub(`/slots?date=${FUTURE}`));
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('past date → 422 (Date must be today or in the future)', async () => {
    const res = await api('GET', pub(`/slots?date=${PAST}&serviceName=${encodeURIComponent(MASTER_SERVICE)}`));
    expect(res.status).toBe(422);
    expect(res.body?.error?.code).toBe('VALIDATION_FAILED');
    assertErrorEnvelope(res);
  });

  it('garbage date → 422', async () => {
    const res = await api('GET', pub(`/slots?date=not-a-date&serviceName=${encodeURIComponent(MASTER_SERVICE)}`));
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('valid query on booking-enabled master → 200 slots payload', async () => {
    const res = await api('GET', pub(`/slots?date=${FUTURE}&serviceName=${encodeURIComponent(MASTER_SERVICE)}`));
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data?.slots)).toBe(true);
    expect(res.body?.data).toHaveProperty('dayClosed');
    expect(res.body?.data).toHaveProperty('durationMinutes');
  });
});

// SMS-COST NOTE: nino-lashes is now bookingEnabled=true, so a VALID /request-otp body would
// send a REAL gosms SMS (it reaches sendOtp). We therefore do NOT exercise a valid booking
// request-otp here — the OTP gate on the booking path is proved instead via /book below with a
// bogus otpRequestId+code, which reaches verifyOtp and fail-closes WITHOUT a gosms round-trip
// that we initiated (no request-otp send). All BookBase Zod validation is covered through /book.

describe('booking public POST /book — shared BookBase validation before OTP verify (no gosms call)', () => {
  it('empty body → 422', async () => {
    const res = await api('POST', pub('/book'), { body: {} });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('non-Georgian phone → 422', async () => {
    const res = await api('POST', pub('/book'), { body: bookBody({ clientPhone: '+15551234567', otpRequestId: 'x', code: '000000' }) });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('missing consent → 422 (literal true required)', async () => {
    const res = await api('POST', pub('/book'), { body: bookBody({ consent: undefined, otpRequestId: 'x', code: '000000' }) });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('bad startTime format → 422', async () => {
    const res = await api('POST', pub('/book'), { body: bookBody({ startTime: '25:99', otpRequestId: 'x', code: '000000' }) });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('missing otpRequestId + code → 422 (no gosms call)', async () => {
    const res = await api('POST', pub('/book'), { body: bookBody() });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('code wrong length → 422 (no gosms call)', async () => {
    const res = await api('POST', pub('/book'), { body: bookBody({ otpRequestId: 'x', code: '123' }) });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  // REGRESSION: OTP fail-closed on the BOOKING path — the booking must NEVER be created on a
  // bogus OTP. verifyAndBook runs assertSlotBookable BEFORE verifyOtp, so the exact rejection
  // depends on the master's working hours: if 14:00 is a bookable slot → verifyOtp fail-closes
  // with 400 INVALID_OTP; if no working hours are configured (seed leaves them empty) → the
  // slot is rejected first with 409 SLOT_UNAVAILABLE. Either way it is a clean 4xx and NO 201.
  // (The waitlist probe already proves verifyOtp itself fail-closes; this asserts the booking
  // path can't create a row on a bad code.)
  it('valid shape, bogus OTP → rejected 4xx, NO booking created (OTP fail-closed on booking path)', async () => {
    const res = await api('POST', pub('/book'), { body: bookBody({ otpRequestId: 'bogus-hash-apitest', code: '000000' }) });
    console.warn(`[BOOKING-OTP-PROBE] /book with bogus OTP → ${res.status} ${JSON.stringify(res.body)}`);
    expect(res.status).not.toBe(201); // never creates a booking on a bogus code
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    // Accept the OTP fail-closed code, or a pre-OTP slot rejection if the master has no hours.
    expect(['INVALID_OTP', 'SLOT_UNAVAILABLE']).toContain(res.body?.error?.code);
    assertErrorEnvelope(res);
  });
});

describe('booking master endpoints — auth & role', () => {
  it('GET /me without a cookie → 401', async () => {
    const res = await api('GET', `${B}/me`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('GET /me as USER (not MASTER) → 403', async () => {
    const res = await api('GET', `${B}/me`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /me as ADMIN (not MASTER) → 403 (route is MASTER-only)', async () => {
    const res = await api('GET', `${B}/me`, { jar: adminJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /me as MASTER → 200 paginated envelope', async () => {
    const res = await api('GET', `${B}/me`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data?.items)).toBe(true);
    expect(res.body?.data?.pagination).toMatchObject({ page: 1, limit: 20 });
  });

  it('GET /me/summary as MASTER → 200', async () => {
    const res = await api('GET', `${B}/me/summary`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('GET /me pagination — limit over max (51) → 422', async () => {
    const res = await api('GET', `${B}/me?limit=51`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /me pagination — page 0 → 422', async () => {
    const res = await api('GET', `${B}/me?page=0`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /me — non-numeric page → 422', async () => {
    const res = await api('GET', `${B}/me?page=abc`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /me — invalid status enum → 422', async () => {
    const res = await api('GET', `${B}/me?status=BOGUS`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });
});

describe('booking master PATCH /me/:id/status — validation, 404, IDOR', () => {
  const RANDOM_UUID = '11111111-1111-4111-8111-111111111111';

  it('non-UUID id → 422', async () => {
    const res = await api('PATCH', `${B}/me/not-a-uuid/status`, { jar: masterJar, body: { status: 'CONFIRMED' } });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('invalid status enum → 422', async () => {
    const res = await api('PATCH', `${B}/me/${RANDOM_UUID}/status`, { jar: masterJar, body: { status: 'PENDING' } });
    expect(res.status).toBe(422); // PENDING is not master-updatable
    assertErrorEnvelope(res);
  });

  it('well-formed but non-existent booking → 404 BOOKING_NOT_FOUND (no cross-master leak)', async () => {
    const res = await api('PATCH', `${B}/me/${RANDOM_UUID}/status`, { jar: masterJar, body: { status: 'CONFIRMED' } });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('BOOKING_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  it('PATCH status without cookie → 401', async () => {
    const res = await api('PATCH', `${B}/me/${RANDOM_UUID}/status`, { body: { status: 'CONFIRMED' } });
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('PATCH status as USER → 403', async () => {
    const res = await api('PATCH', `${B}/me/${RANDOM_UUID}/status`, { jar: userJar, body: { status: 'CONFIRMED' } });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });
});

describe('booking master POST /me/:id/deposit-received — 404, auth', () => {
  const RANDOM_UUID = '22222222-2222-4222-8222-222222222222';

  it('non-existent booking → 404 BOOKING_NOT_FOUND', async () => {
    const res = await api('POST', `${B}/me/${RANDOM_UUID}/deposit-received`, { jar: masterJar });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('BOOKING_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  it('non-UUID id → 422', async () => {
    const res = await api('POST', `${B}/me/xx/deposit-received`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('as USER → 403', async () => {
    const res = await api('POST', `${B}/me/${RANDOM_UUID}/deposit-received`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });
});

describe('booking payment callback (Flitt OFF) — off-platform path leaves it inert', () => {
  it('unsigned callback body → 400 INVALID_SIGNATURE (no auth required, signature-gated)', async () => {
    const res = await api('POST', `${B}/payment/callback`, { body: { order_id: 'x', amount: 100 } });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('INVALID_SIGNATURE');
    assertErrorEnvelope(res);
  });
});
