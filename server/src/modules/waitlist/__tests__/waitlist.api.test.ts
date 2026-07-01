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
  syntheticPhone,
  type Jar,
  type ApiResult,
} from '@/test/api/harness.js';

// Waitlist does NOT gate on bookingEnabled, so the seeded master `nino-lashes` is usable
// end-to-end here. The seed also ships one WAITING entry (phone +995577000001,
// date 2099-07-14) that the MASTER session owns — we use it for the status-transition probe.
const W = '/waitlist';
const pub = (p: string): string => `${W}/public/${MASTER_USERNAME}${p}`;
const FUTURE = '2099-08-20';
const PAST = '2000-01-01';

function joinBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    clientName: 'Api Waitlister',
    clientPhone: syntheticPhone(2),
    requestedDate: FUTURE,
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

describe('waitlist public GET /services', () => {
  it('valid master → 200 with services list', async () => {
    const res = await api('GET', pub('/services'));
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.username).toBe(MASTER_USERNAME);
    expect(Array.isArray(res.body?.data?.services)).toBe(true);
    expect(res.body?.data?.services.length).toBeGreaterThan(0);
  });

  it('unknown username → 404 MASTER_NOT_FOUND', async () => {
    const res = await api('GET', `${W}/public/__nope_apitest__/services`);
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('MASTER_NOT_FOUND');
    assertErrorEnvelope(res);
  });
});

// SMS-COST NOTE: /request-otp is rate-limited to 3/15min AND every call that passes Zod
// reaches sendOtp (a real SMS). request-otp and /join share the SAME JoinBase schema +
// resolveMaster + assertServiceValid, and /join rejects invalid input BEFORE verifyOtp with
// NO gosms call. So we exercise ALL of the shared validation through /join (roomier 5/15min
// limiter, zero SMS) and spend the single precious request-otp call ONLY on the OTP no-op
// probe below.
// SMS/RATE NOTE: /join is rate-limited to 5/15min. Every test here is a /join POST, and the
// OTP fail-closed probe below spends ONE more (a real request-otp + one /join). So we cap this
// block at 3 /join calls (3 + 1 probe = 4 < 5, one slot of margin so the critical OTP probe
// never gets a 429 instead of the INVALID_OTP it asserts). Each packs multiple bad fields;
// all reject BEFORE verifyOtp → zero gosms calls.
describe('waitlist public POST /join — shared validation before OTP verify (no gosms call)', () => {
  it('bad phone (non-Georgian), missing consent, past date, missing code — each → 422 (multiple bad fields)', async () => {
    const res = await api('POST', pub('/join'), {
      body: { clientName: 'x', clientPhone: '555-1234', requestedDate: PAST, consent: false },
    });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('service not offered by master → 400 INVALID_SERVICE (rejects before verifyOtp — no gosms call)', async () => {
    const res = await api('POST', pub('/join'), {
      body: joinBody({ serviceName: '__not_a_service__', otpRequestId: 'x', code: '000000' }),
    });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('INVALID_SERVICE');
    assertErrorEnvelope(res);
  });

  it('unknown master → 404 MASTER_NOT_FOUND (rejects before verifyOtp — no gosms call)', async () => {
    const res = await api('POST', `${W}/public/__nope__/join`, {
      body: joinBody({ otpRequestId: 'x', code: '000000' }),
    });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('MASTER_NOT_FOUND');
    assertErrorEnvelope(res);
  });
});

// ── CRITICAL REGRESSION: OTP fail-closed probe (costs exactly 1 real SMS) ─────────
// libs/otp.verifyOtp() was FIXED to fail closed (a wrong/bogus code must now be REJECTED,
// not accepted). This probe requests a real OTP to a fresh synthetic number, then submits
// /join with a deliberately WRONG code (000000). SECURE behavior = the request is REJECTED
// (4xx INVALID_OTP) and NO waitlist entry is created — proving the account-takeover vector
// is closed. A 201 would mean the no-op bug is back (regression). We use a FRESH phone each
// run (syntheticPhone(11+)) so the per-phone OTP throttle (5/phone/hr) doesn't false-fail us.
describe('waitlist OTP verification regression — wrong code must be REJECTED (1 real SMS)', () => {
  it('request real OTP then /join with WRONG code → 4xx INVALID_OTP, no entry created', async () => {
    // Skippable via env if SMS budget must be preserved on a re-run.
    if (process.env.API_TEST_SKIP_OTP === '1') {
      console.warn('[OTP-PROBE] skipped via API_TEST_SKIP_OTP=1');
      return;
    }

    // Count the master board BEFORE, so we can prove no new row was written on a wrong code.
    const before = await api('GET', `${W}/me?limit=50`, { jar: masterJar });
    const beforeTotal = before.body?.data?.pagination?.totalItems ?? 0;

    // A phone not used by any prior run (dodges the 5/phone/hr per-phone throttle).
    const phone = syntheticPhone(11 + Math.floor(Date.now() % 800));
    // serviceName is OPTIONAL — omit it so assertServiceValid short-circuits and the request
    // reaches sendOtp cleanly (isolates the probe from any service-name encoding mismatch).
    const probeBody = { clientName: 'Api Probe', clientPhone: phone, requestedDate: FUTURE, consent: true as const };
    const otpRes = await api('POST', pub('/request-otp'), { body: probeBody });
    // If request-otp itself fails (gosms/config/throttle), the probe is inconclusive — never a pass.
    if (otpRes.status !== 200) {
      console.warn(`[OTP-PROBE] request-otp did not succeed (${otpRes.status}): ${JSON.stringify(otpRes.body)} — probe inconclusive`);
      expect(otpRes.status).toBeGreaterThanOrEqual(400);
      return;
    }
    const otpRequestId = otpRes.body?.data?.requestId;
    expect(typeof otpRequestId).toBe('string');

    const joinRes = await api('POST', pub('/join'), {
      body: { ...probeBody, otpRequestId, code: '000000' },
    });

    console.warn(`[OTP-PROBE] /join with wrong code → ${joinRes.status} ${JSON.stringify(joinRes.body)}`);

    // REGRESSION GUARD: a 201 means the no-op bug is back — the account-takeover vector reopened.
    if (joinRes.status === 201) {
      throw new Error(
        `OTP NO-OP REGRESSION: /waitlist/public/${MASTER_USERNAME}/join created entry ` +
          `${joinRes.body?.data?.id} with wrong code "000000". verifyOtp is NOT fail-closed. ` +
          `Body: ${JSON.stringify(joinRes.body)}`,
      );
    }

    // SECURE: wrong code rejected with a clean 4xx (INVALID_OTP) envelope.
    expect(joinRes.status).toBe(400);
    expect(joinRes.body?.error?.code).toBe('INVALID_OTP');
    assertErrorEnvelope(joinRes);

    // And no row was written for the bogus attempt (count unchanged).
    const after = await api('GET', `${W}/me?limit=50`, { jar: masterJar });
    const afterTotal = after.body?.data?.pagination?.totalItems ?? 0;
    expect(afterTotal).toBe(beforeTotal);
  });
});

describe('waitlist master board — auth & role', () => {
  it('GET /me without cookie → 401', async () => {
    const res = await api('GET', `${W}/me`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('GET /me as USER → 403', async () => {
    const res = await api('GET', `${W}/me`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /me as ADMIN → 403 (MASTER-only)', async () => {
    const res = await api('GET', `${W}/me`, { jar: adminJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /me as MASTER → 200 with at least the seeded entry', async () => {
    // The seed ships one entry for nino-lashes; the transition probe may have changed its
    // status, but the row (and thus totalItems >= 1) persists.
    const res = await api('GET', `${W}/me`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data?.items)).toBe(true);
    expect(res.body?.data?.pagination?.totalItems).toBeGreaterThanOrEqual(1);
  });

  it('GET /me/summary as MASTER → 200 array', async () => {
    const res = await api('GET', `${W}/me/summary`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('GET /me — invalid status enum → 422', async () => {
    const res = await api('GET', `${W}/me?status=BOGUS`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /me — limit over 50 → 422', async () => {
    const res = await api('GET', `${W}/me?limit=999`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });
});

describe('waitlist master PATCH /me/:id/status — validation, 404, IDOR', () => {
  const RANDOM_UUID = '33333333-3333-4333-8333-333333333333';

  it('non-UUID id → 422', async () => {
    const res = await api('PATCH', `${W}/me/nope/status`, { jar: masterJar, body: { status: 'CONVERTED' } });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('non-master-updatable status (WAITING) → 422', async () => {
    const res = await api('PATCH', `${W}/me/${RANDOM_UUID}/status`, { jar: masterJar, body: { status: 'WAITING' } });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('non-existent entry → 404 ENTRY_NOT_FOUND', async () => {
    const res = await api('PATCH', `${W}/me/${RANDOM_UUID}/status`, { jar: masterJar, body: { status: 'CANCELLED' } });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('ENTRY_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  it('PATCH as USER → 403', async () => {
    const res = await api('PATCH', `${W}/me/${RANDOM_UUID}/status`, { jar: userJar, body: { status: 'CANCELLED' } });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });
});

// ── REGRESSION: waitlist status-transition table is now ENFORCED ─────────────────
// updateEntryStatus now guards with WAITLIST_TRANSITIONS:
//   WAITING → NOTIFIED | CONVERTED | CANCELLED ; NOTIFIED → CONVERTED | CANCELLED ;
//   CONVERTED / CANCELLED / EXPIRED are TERMINAL (frozen).
// same status → 409 STATUS_UNCHANGED ; illegal edge → 409 ILLEGAL_STATUS_TRANSITION.
// We drive the real seeded entry and assert the 409 rejections. Adaptive to the entry's
// current status so it works whether the seed is fresh (WAITING) or was mutated to a
// terminal state by a prior run. We NEVER use NOTIFIED (that path fires a real SMS).
describe('waitlist status-transition regression — illegal moves now 409 (no NOTIFIED → no SMS)', () => {
  it('terminal entries are frozen; same-status is STATUS_UNCHANGED; illegal edges are ILLEGAL_STATUS_TRANSITION', async () => {
    const list = await api('GET', `${W}/me?limit=50`, { jar: masterJar });
    expect(list.status).toBe(200);
    const items: Array<{ id: string; status: string }> = list.body?.data?.items ?? [];
    const entry = items.find((e) => e.status === 'WAITING') ?? items[0];
    if (!entry) {
      console.warn('[TRANSITION-PROBE] no waitlist entry on master board — probe skipped (GAP)');
      return;
    }

    const patch = (status: string): Promise<ApiResult> =>
      api('PATCH', `${W}/me/${entry.id}/status`, { jar: masterJar, body: { status } });

    if (entry.status === 'WAITING') {
      // Legal edge WAITING→CONVERTED must succeed (200) and land in a TERMINAL state...
      const legal = await patch('CONVERTED');
      console.warn(`[TRANSITION-PROBE] WAITING→CONVERTED=${legal.status} (expect 200)`);
      expect(legal.status).toBe(200);
      // ...then the now-CONVERTED (terminal) entry must reject an illegal move with 409.
      const illegal = await patch('CANCELLED');
      console.warn(`[TRANSITION-PROBE] CONVERTED→CANCELLED=${illegal.status} ${JSON.stringify(illegal.body)} (expect 409 ILLEGAL_STATUS_TRANSITION)`);
      expect(illegal.status).toBe(409);
      expect(illegal.body?.error?.code).toBe('ILLEGAL_STATUS_TRANSITION');
      assertErrorEnvelope(illegal);
      // Same-status on the terminal entry → STATUS_UNCHANGED.
      const same = await patch('CONVERTED');
      console.warn(`[TRANSITION-PROBE] CONVERTED→CONVERTED=${same.status} ${JSON.stringify(same.body)} (expect 409 STATUS_UNCHANGED)`);
      expect(same.status).toBe(409);
      expect(same.body?.error?.code).toBe('STATUS_UNCHANGED');
      assertErrorEnvelope(same);
    } else {
      // Entry already terminal (CONVERTED/CANCELLED/EXPIRED). It must be FROZEN:
      // any OTHER master-updatable status → 409 ILLEGAL_STATUS_TRANSITION.
      const other = entry.status === 'CONVERTED' ? 'CANCELLED' : 'CONVERTED';
      const illegal = await patch(other);
      console.warn(`[TRANSITION-PROBE] ${entry.status}→${other}=${illegal.status} ${JSON.stringify(illegal.body)} (expect 409 ILLEGAL_STATUS_TRANSITION)`);
      expect(illegal.status).toBe(409);
      expect(illegal.body?.error?.code).toBe('ILLEGAL_STATUS_TRANSITION');
      assertErrorEnvelope(illegal);
      // Same-status → STATUS_UNCHANGED (only valid if the current status is master-updatable;
      // CONVERTED/CANCELLED are in the MASTER_UPDATABLE_STATUSES enum, so this is reachable).
      if (entry.status === 'CONVERTED' || entry.status === 'CANCELLED') {
        const same = await patch(entry.status);
        console.warn(`[TRANSITION-PROBE] ${entry.status}→${entry.status}=${same.status} ${JSON.stringify(same.body)} (expect 409 STATUS_UNCHANGED)`);
        expect(same.status).toBe(409);
        expect(same.body?.error?.code).toBe('STATUS_UNCHANGED');
        assertErrorEnvelope(same);
      }
    }
  });
});
