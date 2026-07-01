/**
 * Black-box HTTP harness for the GLOW live-API suite.
 *
 * GLOW authenticates with httpOnly cookies (accessToken / refreshToken / session),
 * NOT bearer tokens. This keeps a per-jar cookie store and replays it. No Prisma,
 * no DB access — every session is obtained through the public API.
 *
 * Response contract (read from source):
 *   success: { success: true,  message, data }
 *   error:   { success: false, error: { code, message } }   // NOT a top-level message
 *   paginated data: { items, pagination: { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage } }
 *
 * SMS COST GUARD: request-otp endpoints call the real gosms.ge gateway. Nothing in
 * this harness sends an OTP; individual tests do, sparingly, with synthetic numbers.
 */
const BASE = process.env.API_TEST_BASE_URL ?? 'http://127.0.0.1:8111/api/v1';

export const RUN_ID = process.env.API_TEST_RUN_ID ?? `local_${Date.now()}`;
export const PREFIX = `__apitest_${RUN_ID}`;

// ── Seeded credentials (prisma/seed.ts) ──
export const ADMIN = { email: 'admin@glow.ge', password: 'Admin123!' };
export const USER = { email: 'test@glow.ge', password: 'Test1234!' };
export const MASTER = { email: 'master@glow.ge', password: 'Master123!' };
export const MASTER_USERNAME = 'nino-lashes';
// A service the seeded master actually offers (for waitlist service-valid checks).
export const MASTER_SERVICE = 'კლასიკური წამწამები';

export type Jar = Map<string, string>;
export const newJar = (): Jar => new Map();

function storeSetCookies(jar: Jar, res: Response): void {
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) {
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      // clearCookie emits an empty value + past expiry — drop it so logout/refresh work.
      if (value === '' || /expires=thu, 01 jan 1970/i.test(line)) jar.delete(name);
      else jar.set(name, value);
    }
  }
}

function cookieHeader(jar: Jar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export interface ApiResult {
  status: number;
  // Parsed JSON response body; shape varies per endpoint, so tests read it defensively.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  headers: Headers;
}

export async function api(
  method: string,
  path: string,
  opts: { body?: unknown; jar?: Jar; headers?: Record<string, string>; rawBody?: string } = {},
): Promise<ApiResult> {
  const hasBody = opts.rawBody !== undefined || opts.body !== undefined;
  // IMPORTANT: only send Content-Type: application/json when there IS a body. Fastify's JSON
  // parser rejects an EMPTY body carrying `application/json` with 400 FST_ERR_CTP_EMPTY_JSON_BODY
  // BEFORE any preHandler/handler runs — which would mask the real 401/403/404 on bodyless
  // POST/DELETE routes (interest, deposit-received, photo delete). Callers may still override
  // Content-Type explicitly via opts.headers (e.g. to test wrong content-type).
  const headers: Record<string, string> = { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...opts.headers };
  if (opts.jar && opts.jar.size) headers['Cookie'] = cookieHeader(opts.jar);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body:
      opts.rawBody !== undefined
        ? opts.rawBody
        : opts.body !== undefined
          ? JSON.stringify(opts.body)
          : undefined,
  });
  if (opts.jar) storeSetCookies(opts.jar, res);
  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Parse "Rate limit exceeded, retry in 12 minutes" → ms (with a small safety margin).
function retryAfterMs(body: unknown): number | null {
  const msg = (body as { error?: { message?: string } })?.error?.message ?? '';
  const m = /retry in (\d+)\s*minute/i.exec(msg);
  if (m) return (Number(m[1]) + 1) * 60_000;
  const s = /retry in (\d+)\s*second/i.exec(msg);
  if (s) return (Number(s[1]) + 2) * 1000;
  return null;
}

// Retry a 429'd auth call ONCE after waiting out the reported window. This deployment's
// @fastify/rate-limit refreshes the login window on every over-limit hit, so we must NOT
// poll — we wait the full reported backoff a single time, then make exactly one more attempt.
// Skippable via API_TEST_SKIP_RL_WAIT=1 (then a 429 fails fast).
async function postWithRateBackoff(
  path: string,
  body: unknown,
  jar: Jar,
): Promise<ApiResult> {
  let res = await api('POST', path, { jar, body });
  if (res.status === 429 && process.env.API_TEST_SKIP_RL_WAIT !== '1') {
    const waitMs = retryAfterMs(res.body) ?? 16 * 60_000;
    console.warn(
      `[harness] ${path} rate-limited (429). Waiting ${Math.round(waitMs / 60000)} min for the ` +
        'window to clear, then retrying ONCE (no polling — polling would reset the window)…',
    );
    await sleep(waitMs);
    res = await api('POST', path, { jar, body });
  }
  return res;
}

// Process-wide login cache. login is IP-rate-limited (10/15min), and the suite runs in a
// single worker thread with isolate:false (see vitest.api.config.ts), so we authenticate each
// seeded account AT MOST ONCE per run and replay the same jar everywhere. Cookies are the
// session, so a shared jar is safe for read-heavy checks; tests that mutate seed state do so
// serially.
const _loginCache = new Map<string, Jar>();

/** Log in a seeded account (cached per run, rate-limit-backoff aware); cookies land in the jar. */
export async function login(creds: { email: string; password: string }): Promise<Jar> {
  const cached = _loginCache.get(creds.email);
  if (cached) return cached;
  const jar = newJar();
  const res = await postWithRateBackoff('/auth/login', creds, jar);
  if (res.status !== 200) {
    throw new Error(`login(${creds.email}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  _loginCache.set(creds.email, jar);
  return jar;
}

let userSeq = 0;
export function testEmail(suffix: string): string {
  return `${PREFIX}_${suffix}@apitest.local`;
}

export interface TestUser {
  jar: Jar;
  userId: string;
  email: string;
}

/**
 * Register a fresh USER via the API (no phone → no SMS, no verification gate).
 * Register issues auth cookies immediately (setAuthCookies always fires), so the
 * returned jar is a live session — but phoneVerified is false, so it can only reach
 * `authenticate`-only routes, not `requirePhoneVerified` ones.
 */
export async function registerUser(suffix = `u${++userSeq}`): Promise<TestUser> {
  const jar = newJar();
  const email = testEmail(suffix);
  const res = await postWithRateBackoff(
    '/auth/register',
    { email, password: 'TestPass123!', firstName: 'Api', lastName: 'Tester' },
    jar,
  );
  if (res.status !== 201) {
    throw new Error(`registerUser(${suffix}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { jar, userId: res.body?.data?.user?.id, email };
}

// One shared registered USER for the whole run. `register` is IP-rate-limited (5/15min),
// so tests that just need "a fresh authenticated non-privileged session" or "an email that
// already exists" reuse this single account instead of each burning a register slot.
let _sharedUser: TestUser | null = null;
export async function sharedRegisteredUser(): Promise<TestUser> {
  if (_sharedUser) return _sharedUser;
  _sharedUser = await registerUser('shared');
  return _sharedUser;
}

/** A syntactically-valid Georgian phone that is NOT a real handset (00-prefixed line). */
export function syntheticPhone(n: number): string {
  return `+99550000${String(n).padStart(4, '0')}`;
}

/** True when the body leaks no server internals (stack / prisma / raw SQL / paths). */
export function leaksInternals(body: unknown): boolean {
  const s = JSON.stringify(body ?? '').toLowerCase();
  return (
    s.includes('prisma') ||
    s.includes('\\n    at ') ||
    s.includes('node_modules') ||
    s.includes('select ') ||
    s.includes('.ts:') ||
    s.includes('stack')
  );
}

/** Assert the standard error envelope shape: { success:false, error:{ code, message } }, no leaks. */
export function assertErrorEnvelope(res: ApiResult): void {
  if (res.body?.success !== false) {
    throw new Error(`expected success:false, got ${JSON.stringify(res.body)}`);
  }
  if (typeof res.body?.error?.code !== 'string' || typeof res.body?.error?.message !== 'string') {
    throw new Error(`expected error:{code,message} strings, got ${JSON.stringify(res.body)}`);
  }
  if (leaksInternals(res.body)) {
    throw new Error(`error body leaks internals: ${JSON.stringify(res.body)}`);
  }
}
