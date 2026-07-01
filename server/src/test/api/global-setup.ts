// Boot gate for the live API suite: poll the GLOW health endpoint and fail fast with a clear
// SERVER_DOWN message so the agent knows to start `npm run dev`. The login rate-limit backoff
// is handled in the harness (login()/registerUser() are retry-aware), NOT here — see the note
// below for why probing login from setup is unsafe.
const BASE = process.env.API_TEST_BASE_URL ?? 'http://127.0.0.1:8111/api/v1';
const HEALTH = `${BASE.replace(/\/api\/v1$/, '')}/api/v1/health`;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitForServer(): Promise<void> {
  const attempts = Number(process.env.API_TEST_BOOT_ATTEMPTS ?? 1);
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(HEALTH);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    if (i < attempts - 1) await sleep(1000);
  }
  throw new Error(
    `SERVER_DOWN: ${HEALTH} did not return 200 after ${attempts} attempt(s). ` +
      `Start the server (cd server && npm run dev) + infra (docker compose up -d) and retry.`,
  );
}

// NOTE ON THE LOGIN RATE LIMIT: /auth/login is 10/15min per IP, and this deployment's
// @fastify/rate-limit refreshes the 15-min window on EVERY request that arrives while
// over-limit. So we must NOT probe /auth/login here at all — a single stray probe at the
// wrong moment resets the window and the seeded logins that follow immediately still 429.
// Instead, the harness's login()/registerUser() are retry-aware: they parse "retry in N
// minutes" and wait it out ONCE (a legitimate client backoff). With isolate:false + the
// login cache, the whole run performs only ~3 logins total, so a single cooldown at the
// very start (if needed) unblocks the entire suite. Set API_TEST_SKIP_RL_WAIT=1 to make the
// harness fail fast on 429 instead of waiting.

export default async function setup(): Promise<void> {
  await waitForServer();
}
