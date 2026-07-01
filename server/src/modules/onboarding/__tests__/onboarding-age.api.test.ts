import { describe, it, expect, beforeAll } from 'vitest';
import { api, sharedRegisteredUser, assertErrorEnvelope, type TestUser } from '@/test/api/harness.js';

// Reuse the run's single shared USER — register is IP-rate-limited (5/15min). A 422 from
// /onboarding/complete does NOT mutate the account, so the same session is reusable across
// every rejection case here.
let u: TestUser;
beforeAll(async () => {
  u = await sharedRegisteredUser();
});

// ── 18+ SERVER-SIDE AGE PROBE ────────────────────────────────────────────────────
// The review suspected the server does not validate a model's age. ModelOnboardingSchema
// applies birthDate: z.string().refine(isAdult, ...) INSIDE the discriminated union that
// /onboarding/complete parses in the controller (before the service). We POST a MODEL
// onboarding with an under-18 birthDate and expect a 422 rejection. A 2xx would confirm
// the review's finding (age check missing). We deliberately do NOT submit an adult
// birthDate (that would create a real model profile row).
const O = '/onboarding';

function underageBirthDate(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 15); // 15 years old
  return d.toISOString().slice(0, 10);
}

function modelBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    role: 'MODEL',
    displayName: 'Api Model',
    city: 'tbilisi',
    birthDate: underageBirthDate(),
    consent: true,
    ...over,
  };
}

describe('onboarding /complete — 18+ server-side check for MODEL role', () => {
  it('POST /complete without cookie → 401', async () => {
    const res = await api('POST', `${O}/complete`, { body: modelBody() });
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('under-18 MODEL birthDate → 422 (server rejects — age check is PRESENT)', async () => {
    const res = await api('POST', `${O}/complete`, { jar: u.jar, body: modelBody() });

    console.warn(`[AGE-PROBE] under-18 MODEL onboarding → ${res.status} ${JSON.stringify(res.body)}`);

    if (res.status >= 200 && res.status < 300) {
      throw new Error(
        `18+ CHECK MISSING (CONFIRMED): /onboarding/complete accepted a 15-year-old MODEL. Body: ${JSON.stringify(res.body)}`,
      );
    }
    expect(res.status).toBe(422);
    expect(res.body?.error?.code).toBe('VALIDATION_FAILED');
    expect(res.body?.error?.message).toMatch(/18 years old/i);
    assertErrorEnvelope(res);
  });

  it('MODEL onboarding missing consent → 422 (consent literal true required)', async () => {
    // Adult date this time, but drop consent → must still 422 (not a model row created).
    const adult = new Date();
    adult.setUTCFullYear(adult.getUTCFullYear() - 25);
    const res = await api('POST', `${O}/complete`, {
      jar: u.jar,
      body: modelBody({ birthDate: adult.toISOString().slice(0, 10), consent: undefined }),
    });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('MODEL onboarding with garbage birthDate → 422 (isAdult rejects unparseable date)', async () => {
    const res = await api('POST', `${O}/complete`, {
      jar: u.jar,
      body: modelBody({ birthDate: 'not-a-date' }),
    });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('unknown role in discriminated union → 422', async () => {
    const res = await api('POST', `${O}/complete`, { jar: u.jar, body: { role: 'ROBOT' } });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });
});
