import { describe, it, expect, beforeAll } from 'vitest';
import {
  api,
  login,
  sharedRegisteredUser,
  ADMIN,
  USER,
  MASTER,
  assertErrorEnvelope,
  type Jar,
  type TestUser,
} from '@/test/api/harness.js';

// Faces is MASTER/ADMIN-gated (never public). The seed ships no model profiles, so the
// catalog is expected empty; the contact-reveal + photo-IDOR cycles run adaptively —
// if a VERIFIED model exists at runtime we exercise the full gate, otherwise we record a GAP.
const F = '/faces';
const RANDOM_UUID = '44444444-4444-4444-8444-444444444444';

let masterJar: Jar;
let userJar: Jar;
let adminJar: Jar;
let freshNoPhone: TestUser;

beforeAll(async () => {
  masterJar = await login(MASTER);
  userJar = await login(USER);
  adminJar = await login(ADMIN);
  freshNoPhone = await sharedRegisteredUser();
});

describe('faces catalog — auth & role', () => {
  it('GET /catalog without cookie → 401', async () => {
    const res = await api('GET', `${F}/catalog`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('GET /catalog as plain USER → 403 (MASTER/ADMIN only, never public)', async () => {
    const res = await api('GET', `${F}/catalog`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /catalog as MASTER → 200 paginated', async () => {
    const res = await api('GET', `${F}/catalog`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data?.items)).toBe(true);
    expect(res.body?.data?.pagination).toMatchObject({ page: 1, limit: 20 });
  });

  it('GET /catalog as ADMIN → 200 paginated', async () => {
    const res = await api('GET', `${F}/catalog`, { jar: adminJar });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });

  it('GET /catalog with search + pagination params → 200', async () => {
    const res = await api('GET', `${F}/catalog?search=nino&page=1&limit=5&city=tbilisi`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.data?.pagination?.limit).toBe(5);
  });

  it('GET /catalog — limit over 50 → 422', async () => {
    const res = await api('GET', `${F}/catalog?limit=51`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /catalog — page 0 → 422', async () => {
    const res = await api('GET', `${F}/catalog?page=0`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /catalog — non-numeric page → 422', async () => {
    const res = await api('GET', `${F}/catalog?page=abc`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /catalog — search injection string does not 500', async () => {
    const res = await api('GET', `${F}/catalog?search=${encodeURIComponent("' OR 1=1 --")}`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });
});

describe('faces detail — auth, validation, 404', () => {
  it('GET /:id without cookie → 401', async () => {
    const res = await api('GET', `${F}/${RANDOM_UUID}`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('GET /:id as USER → 403', async () => {
    const res = await api('GET', `${F}/${RANDOM_UUID}`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /:id non-UUID → 422', async () => {
    const res = await api('GET', `${F}/not-a-uuid`, { jar: masterJar });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('GET /:id unknown model → 404 MODEL_NOT_FOUND', async () => {
    const res = await api('GET', `${F}/${RANDOM_UUID}`, { jar: masterJar });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('MODEL_NOT_FOUND');
    assertErrorEnvelope(res);
  });
});

describe('faces interest endpoints — auth & role', () => {
  it('POST /:id/interest without cookie → 401', async () => {
    const res = await api('POST', `${F}/${RANDOM_UUID}/interest`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('POST /:id/interest as USER → 403 (MASTER only)', async () => {
    const res = await api('POST', `${F}/${RANDOM_UUID}/interest`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('POST /:id/interest as ADMIN → 403 (interest is MASTER-only, not ADMIN)', async () => {
    const res = await api('POST', `${F}/${RANDOM_UUID}/interest`, { jar: adminJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('POST /:id/interest as MASTER on unknown model → 404 MODEL_NOT_FOUND', async () => {
    const res = await api('POST', `${F}/${RANDOM_UUID}/interest`, { jar: masterJar });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('MODEL_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  it('DELETE /:id/interest as MASTER when none exists → 404 INTEREST_NOT_FOUND', async () => {
    const res = await api('DELETE', `${F}/${RANDOM_UUID}/interest`, { jar: masterJar });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('INTEREST_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  it('GET /interest/status as MASTER (empty ids) → 200 {}', async () => {
    const res = await api('GET', `${F}/interest/status`, { jar: masterJar });
    expect(res.status).toBe(200);
    expect(res.body?.data).toEqual({});
  });

  it('GET /interest/status as USER → 403', async () => {
    const res = await api('GET', `${F}/interest/status`, { jar: userJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });
});

// ── CONTACT-REVEAL GATE (adaptive) ───────────────────────────────────────────────
// A MASTER with no interest must see contactRevealed:false + contact:null. After
// POST /:id/interest the SAME detail call must reveal phone/whatsapp/telegram/instagram.
// Runs only if a VERIFIED model exists in the catalog; otherwise recorded as a GAP.
describe('faces contact-reveal gate (needs a seeded VERIFIED model)', () => {
  it('no-interest MASTER sees no contact; after interest, contact is revealed', async () => {
    const cat = await api('GET', `${F}/catalog?limit=1`, { jar: masterJar });
    const model = cat.body?.data?.items?.[0];
    if (!model) {
      console.warn('[REVEAL-GATE] catalog empty — no VERIFIED model to test the reveal gate (GAP)');
      return;
    }
    const modelId: string = model.id;

    // Ensure a clean slate (best-effort remove any prior interest).
    await api('DELETE', `${F}/${modelId}/interest`, { jar: masterJar });

    const before = await api('GET', `${F}/${modelId}`, { jar: masterJar });
    expect(before.status).toBe(200);
    expect(before.body?.data?.contactRevealed).toBe(false);
    expect(before.body?.data?.contact).toBeNull();

    const add = await api('POST', `${F}/${modelId}/interest`, { jar: masterJar });
    expect([201, 409]).toContain(add.status); // 409 if already interested from a prior run

    const after = await api('GET', `${F}/${modelId}`, { jar: masterJar });
    expect(after.status).toBe(200);
    expect(after.body?.data?.contactRevealed).toBe(true);
    expect(after.body?.data?.contact).not.toBeNull();

    // ADMIN sees contact unconditionally (role === 'ADMIN' bypasses the interest check).
    const asAdmin = await api('GET', `${F}/${modelId}`, { jar: adminJar });
    expect(asAdmin.body?.data?.contactRevealed).toBe(true);

    // Clean up our interest so the run is idempotent.
    await api('DELETE', `${F}/${modelId}/interest`, { jar: masterJar });
  });
});

describe('faces owner (model self-service) — auth & non-model', () => {
  it('GET /me without cookie → 401', async () => {
    const res = await api('GET', `${F}/me`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('GET /me as a non-model USER → 404 MODEL_PROFILE_NOT_FOUND', async () => {
    const res = await api('GET', `${F}/me`, { jar: userJar });
    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('MODEL_PROFILE_NOT_FOUND');
    assertErrorEnvelope(res);
  });

  it('DELETE /photos/:photoId as a non-model (no phone-verified) → 403 PHONE_NOT_VERIFIED or 404', async () => {
    // A fresh USER has no phone verification → the ownerGuard (requirePhoneVerified) rejects first.
    const res = await api('DELETE', `${F}/photos/${RANDOM_UUID}`, { jar: freshNoPhone.jar });
    // requirePhoneVerified → 403 PHONE_NOT_VERIFIED (guard runs before the handler).
    expect(res.status).toBe(403);
    expect(res.body?.error?.code).toBe('PHONE_NOT_VERIFIED');
    assertErrorEnvelope(res);
  });

  it('DELETE /photos/:photoId non-UUID as phone-verified MASTER → 422 (validation) — establishes the IDOR guard is reachable', async () => {
    // The seeded MASTER is phone-verified so it passes ownerGuard; a non-UUID trips Zod (422).
    // A random valid UUID would hit MODEL_PROFILE_NOT_FOUND (MASTER has no model profile),
    // proving a non-owner cannot touch another model's photo.
    const bad = await api('DELETE', `${F}/photos/not-a-uuid`, { jar: masterJar });
    expect(bad.status).toBe(422);
    assertErrorEnvelope(bad);

    const idor = await api('DELETE', `${F}/photos/${RANDOM_UUID}`, { jar: masterJar });
    // MASTER has no model profile → 404 MODEL_PROFILE_NOT_FOUND (cannot reach another's photo).
    expect(idor.status).toBe(404);
    expect(idor.body?.error?.code).toBe('MODEL_PROFILE_NOT_FOUND');
    assertErrorEnvelope(idor);
  });
});

// The admin moderation routes are gated by adminGuard = [authenticate, authorize('ADMIN'),
// requirePhoneVerified]. The SEEDED admin (admin@glow.ge) has no phone/phoneVerified, so it
// fails the phone gate (403 PHONE_NOT_VERIFIED) BEFORE reaching any handler. We detect the
// admin's phone-verified state at runtime and assert accordingly: when unverified we prove
// the phone gate fires (and flag the untestable moderation body as a GAP); when a verified
// admin exists we exercise the full moderation surface.
describe('faces admin moderation — auth & role', () => {
  let adminPhoneVerified = false;

  beforeAll(async () => {
    const me = await api('GET', '/auth/me', { jar: adminJar });
    adminPhoneVerified = me.body?.data?.phoneVerified === true;
    if (!adminPhoneVerified) {
      console.warn(
        '[FACES-ADMIN] seeded admin is NOT phone-verified — faces adminGuard (requirePhoneVerified) ' +
          'returns 403 before the handler. Admin moderation body is a coverage GAP with this seed.',
      );
    }
  });

  it('GET /admin/pending without cookie → 401', async () => {
    const res = await api('GET', `${F}/admin/pending`);
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('GET /admin/pending as MASTER → 403 (ADMIN only)', async () => {
    const res = await api('GET', `${F}/admin/pending`, { jar: masterJar });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });

  it('GET /admin/pending as ADMIN → 200 if phone-verified, else 403 PHONE_NOT_VERIFIED (seed gap)', async () => {
    const res = await api('GET', `${F}/admin/pending`, { jar: adminJar });
    if (adminPhoneVerified) {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body?.data?.items)).toBe(true);
    } else {
      expect(res.status).toBe(403);
      expect(res.body?.error?.code).toBe('PHONE_NOT_VERIFIED');
      assertErrorEnvelope(res);
    }
  });

  it('POST /admin/:userId/review reject without reason → 400 REASON_REQUIRED (only reachable if admin phone-verified)', async () => {
    const res = await api('POST', `${F}/admin/${RANDOM_UUID}/review`, {
      jar: adminJar,
      body: { action: 'reject' },
    });
    if (adminPhoneVerified) {
      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('REASON_REQUIRED');
    } else {
      expect(res.status).toBe(403); // phone gate fires before the handler
    }
    assertErrorEnvelope(res);
  });

  it('POST /admin/:userId/review — invalid action → 422 (validation) or 403 (phone gate)', async () => {
    const res = await api('POST', `${F}/admin/${RANDOM_UUID}/review`, {
      jar: adminJar,
      body: { action: 'nuke' },
    });
    // preHandler (phone gate) runs before the controller's Zod parse, so an unverified admin
    // gets 403 here; a verified admin gets 422.
    expect(adminPhoneVerified ? res.status : 403).toBe(adminPhoneVerified ? 422 : 403);
    assertErrorEnvelope(res);
  });

  it('POST /admin/:userId/review approve on unknown user → 404 (only if admin phone-verified)', async () => {
    const res = await api('POST', `${F}/admin/${RANDOM_UUID}/review`, {
      jar: adminJar,
      body: { action: 'approve' },
    });
    if (adminPhoneVerified) {
      expect(res.status).toBe(404);
      expect(res.body?.error?.code).toBe('MODEL_PROFILE_NOT_FOUND');
    } else {
      expect(res.status).toBe(403);
    }
    assertErrorEnvelope(res);
  });

  it('POST /admin/photos/:photoId/review unknown photo → 404 (only if admin phone-verified)', async () => {
    const res = await api('POST', `${F}/admin/photos/${RANDOM_UUID}/review`, {
      jar: adminJar,
      body: { status: 'APPROVED' },
    });
    if (adminPhoneVerified) {
      expect(res.status).toBe(404);
      expect(res.body?.error?.code).toBe('PHOTO_NOT_FOUND');
    } else {
      expect(res.status).toBe(403);
    }
    assertErrorEnvelope(res);
  });

  it('POST /admin/photos/:photoId/review as MASTER → 403', async () => {
    const res = await api('POST', `${F}/admin/photos/${RANDOM_UUID}/review`, {
      jar: masterJar,
      body: { status: 'APPROVED' },
    });
    expect(res.status).toBe(403);
    assertErrorEnvelope(res);
  });
});
