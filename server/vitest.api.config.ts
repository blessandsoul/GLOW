import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// GLOW dev server listens on :8111 (server/.env PORT). The base URL is read from
// API_TEST_BASE_URL (default http://127.0.0.1:8111/api/v1) inside the harness/setup.

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.api.test.ts'],
    exclude: ['node_modules', 'dist'],
    globalSetup: ['./src/test/api/global-setup.ts'],
    testTimeout: 30000,
    // hookTimeout is generous: the FIRST seeded login in a beforeAll may hit the login
    // rate-limit window (10/15min) and the harness waits it out ONCE before retrying. 20 min
    // comfortably covers a full 15-min window cool-down. Steady-state runs (window already
    // open) finish in seconds; this only matters right after a prior login burst.
    hookTimeout: 20 * 60_000,
    // Single worker thread so ALL test files share one module instance — the login cache
    // in harness.ts then logs in each seeded account ONCE per run (login is IP-rate-limited
    // at 10/15min, so per-file logins would trip 429). Serial + no parallelism: the live
    // suite mutates shared seed rows and must not race itself.
    // Vitest 4 moved poolOptions to top-level (`test.poolOptions` was removed).
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 1,
    fileParallelism: false,
    // isolate:false keeps ONE module registry across all test files, so the login/register
    // caches in harness.ts are genuinely shared run-wide (vitest isolates per-file by default,
    // which would re-run each file's logins and trip the 10/15min login limiter). Safe here:
    // the suite has no global side-effects to leak between files.
    isolate: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@modules': resolve(__dirname, './src/modules'),
      '@libs': resolve(__dirname, './src/libs'),
      '@config': resolve(__dirname, './src/config'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
});
