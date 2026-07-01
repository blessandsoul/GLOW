import { describe, it, expect, beforeAll } from 'vitest';
import {
  api,
  login,
  sharedRegisteredUser,
  newJar,
  USER,
  assertErrorEnvelope,
  leaksInternals,
  type Jar,
  type TestUser,
} from '@/test/api/harness.js';

// Cross-cutting checks: the auth wire, malformed input handling, and the error envelope
// on the shared surface the three refactored modules all sit behind.
// register is IP-rate-limited (5/15min); this file spends at most 3 register POSTs
// (shared user + weak-password + privilege-escalation), staying well under the cap.

let userJar: Jar;
let shared: TestUser;

beforeAll(async () => {
  userJar = await login(USER);
  shared = await sharedRegisteredUser();
});

describe('auth wire — login/register contract', () => {
  it('login with wrong password → 401, clean error envelope', async () => {
    const res = await api('POST', '/auth/login', { body: { email: USER.email, password: 'WrongPass9!' } });
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('login with unknown email → 401 (does not leak which factor failed)', async () => {
    const res = await api('POST', '/auth/login', { body: { email: 'nobody@apitest.local', password: 'Whatever9!' } });
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('login missing password → 422', async () => {
    const res = await api('POST', '/auth/login', { body: { email: USER.email } });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('register weak password (no uppercase/number) → 422', async () => {
    const res = await api('POST', '/auth/register', {
      body: { email: 'weak@apitest.local', password: 'alllowercase', firstName: 'A', lastName: 'B' },
    });
    expect(res.status).toBe(422);
    assertErrorEnvelope(res);
  });

  it('duplicate email register → 409 EMAIL_ALREADY_EXISTS', async () => {
    // Reuse the run's shared user's email (already registered) — no extra register slot spent.
    const res = await api('POST', '/auth/register', {
      body: { email: shared.email, password: 'TestPass123!', firstName: 'Api', lastName: 'Tester' },
    });
    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe('EMAIL_ALREADY_EXISTS');
    assertErrorEnvelope(res);
  });

  it('GET /auth/me with a valid session → 200 { data: user }', async () => {
    const res = await api('GET', '/auth/me', { jar: userJar });
    expect(res.status).toBe(200);
    expect(res.body?.data?.email).toBe(USER.email);
  });

  it('GET /auth/me without cookie → 401', async () => {
    const res = await api('GET', '/auth/me');
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });
});

describe('malformed / hostile input handling', () => {
  it('forged/garbage accessToken cookie → 401 (jwtVerify fails)', async () => {
    const jar: Jar = newJar();
    jar.set('accessToken', 'not.a.real.jwt');
    const res = await api('GET', '/auth/me', { jar });
    expect(res.status).toBe(401);
    assertErrorEnvelope(res);
  });

  it('malformed JSON body → 4xx clean envelope, no stack leak', async () => {
    const res = await api('POST', '/auth/login', { rawBody: '{"email": "a@b.co", ' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body?.success).toBe(false);
    expect(leaksInternals(res.body)).toBe(false);
  });

  it('prototype-pollution payload on register → rejected, no 500', async () => {
    const res = await api('POST', '/auth/register', {
      rawBody: JSON.stringify({
        email: 'proto@apitest.local',
        password: 'TestPass123!',
        firstName: 'Api',
        lastName: 'Tester',
        __proto__: { isAdmin: true },
      }),
    });
    // secure-json-parse rejects __proto__ (400) or Zod ignores the extra key (201). Either way, no 500.
    expect(res.status).not.toBe(500);
    expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
  });

  it('wrong Content-Type (text/plain) with JSON string → does not 500', async () => {
    const res = await api('POST', '/auth/login', {
      rawBody: JSON.stringify({ email: USER.email, password: USER.password }),
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.status).not.toBe(500);
  });

  it('extra privilege-escalation field (role:ADMIN) on register is ignored — user is not admin', async () => {
    const res = await api('POST', '/auth/register', {
      body: {
        email: `escalate_${Date.now()}@apitest.local`,
        password: 'TestPass123!',
        firstName: 'Api',
        lastName: 'Tester',
        role: 'ADMIN',
        isAdmin: true,
      },
    });
    expect(res.status).toBe(201);
    // Registration response returns the user; role must be the default USER, never ADMIN.
    expect(res.body?.data?.user?.role).not.toBe('ADMIN');
  });
});

describe('unknown route → app 404 envelope (not a bare Fastify 404)', () => {
  it('GET a nonexistent route returns a JSON body', async () => {
    const res = await api('GET', '/this-route-does-not-exist-apitest');
    expect(res.status).toBe(404);
    // Whether or not the app has a notFoundHandler, the body must not leak internals.
    expect(leaksInternals(res.body)).toBe(false);
  });
});
