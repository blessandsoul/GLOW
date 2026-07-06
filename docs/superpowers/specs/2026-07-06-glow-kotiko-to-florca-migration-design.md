# GLOW migration: kotiko → florca (design)

**Date:** 2026-07-06
**Status:** design approved (pending spec review)
**App:** GLOW (create-tigra monorepo — Next.js 16 client + Fastify 5 / Prisma 6 / MySQL / Redis)
**Repo:** github.com/blessandsoul/GLOW @ main
**Live prod, real users.** Data integrity is the hard requirement.

## Goal

Move GLOW from the kotiko VPS (148.251.167.227, Coolify, memory-degraded) to the florca VPS
(144.76.30.237, Coolify, healthy — 7.6 GiB avail). Do it in two phases so kotiko stays a live,
untouched rollback until the operator is satisfied.

- **Phase 1 (now):** stand GLOW up on florca under a **Coolify-generated fake domain**, then copy prod
  data so the fake-domain site is a full replica for validation.
- **Phase 2 (later, on explicit ask, at night with users offline):** compare kotiko vs florca, do a
  final re-sync until identical, operator flips the real domain IP → florca.

## Hard constraints

- MySQL `glowge` data and the `/app/uploads` persistent storage must be **100% identical** at cutover.
- kotiko is **never modified** during Phase 1 or the copy — it remains the source of truth and instant
  rollback. The only kotiko mutation is an optional brief maintenance/stop at the Phase-2 window.
- Redis is **pure cache** → florca starts with empty Redis (nothing copied).
- Cutover downtime window ~5–15 min is acceptable.

## Step 0 — sharp/CPU prerequisite (RESOLVED 2026-07-06, not a blocker)

florca's CPU is emulated **sub-x86-64-v2** (has sse3/cx16, missing ssse3/sse4/popcnt/avx). Investigated
(and a first false alarm corrected — see memory `florca-cpu-no-avx-skia-sigill`):

- **Verified fact:** the **glibc** sharp ≥0.33 prebuilt (`@img/sharp-linux-x64`) hard-refuses to load on
  this CPU (`require v2 microarchitecture`). GLOW ships `sharp ^0.34.5` on a **glibc** base
  (`server/Dockerfile` = `FROM node:20-slim`), so **as-built GLOW would fail to boot on florca**.
- **Also verified:** the **musl/Alpine** sharp prebuilt (`@img/sharp-linuxmusl-x64`, libvips 8.17 +
  Highway runtime SIMD dispatch) runs **sharp 0.34.5 fine on florca** — proven by multiple live Coolify
  apps already on florca (`require('sharp')` + real `.resize().blur().jpeg()` = `PROCESS-OK`).

**So this is a one-time build tweak, not a CPU wall.** Before provisioning GLOW on florca, apply ONE of
(operator's choice, tracked as a pre-req task):
- **(a) Switch GLOW server image `node:20-slim` → `node:20-alpine`** — matches the apps already working
  on florca. Also requires flipping Prisma `binaryTargets` to `linux-musl-openssl-3.0.x` and
  re-validating any other native deps under musl.
- **(b) Pin `sharp` to `0.32.6`** (glibc prebuilt loads on sub-v2) — smallest diff; older sharp.
- **(c) Keep glibc, build sharp from system libvips** (`apt-get install libvips-dev` + build-from-source
  / `SHARP_FORCE_GLOBAL_LIBVIPS=1`) — keeps 0.34.5; heavier build image.

Gate: after the chosen tweak, deploy on florca and confirm image upload + watermark actually process
(not just load). No hypervisor/CPU-model change or host reboot is required.

## Phase 1 — stand up on florca (fake domain)

Split into two operator-approved runs (empty first, then data).

### Run A — provision + deploy empty + verify sharp
1. **coolify-ops (kotiko):** inventory GLOW — server app, client app, ALL env vars, volume mounts
   (`/app/uploads`), MySQL + Redis service definitions. This snapshot is the provisioning source of truth.
2. **coolify-ops (florca):** create project; provision MySQL (`glowge` schema), Redis, `uploads` volume;
   create server + client apps from `blessandsoul/GLOW@main` on Coolify-generated fake domains.
3. **Env (florca):** replicate kotiko env as **runtime** vars (Coolify env = runtime-only). Server →
   florca-local `DATABASE_URL` / `REDIS_URL` + the **fake** server domain, CORS, `COOKIE_DOMAIN` for the
   fake host. Client built with the **fake** `NEXT_PUBLIC_*` API domain so fake-client → fake-server is
   fully self-contained. (`NEXT_PUBLIC_*` is build-time per the create-tigra deploy contract — the
   client is deliberately built twice: fake now, real at cutover.)
4. **Deploy + verify (empty):** app boots; **sharp processes a real upload** on florca; login works
   against the empty DB; vps-check confirms florca headroom. **Operator approves before Run B.**

### Run B — copy prod data
5. **MySQL:** `mysqldump glowge` on kotiko (via `docker exec` on the Coolify MySQL container) streamed
   over SSH into florca's MySQL. **Executed directly by the operator's assistant over the existing SSH
   access** (outside the fenced agent catalogs — one-time, every command shown + confirmed first).
6. **Uploads:** `rsync -az` `/app/uploads` kotiko → florca volume.
7. **Redis:** skipped (empty cache).
8. **Re-validate on fake domain:** full replica — real data visible, images/watermarks render, login
   with a real account works.

## Phase 2 — real-domain cutover (later, explicit ask, at night)

1. Confirm traffic quiesced (users offline).
2. **Compare** kotiko vs florca: per-table rowcounts + table checksums; uploads file-count + checksum
   set. Report every delta.
3. **Final re-sync:** fresh `mysqldump` → restore; `rsync` uploads delta. Re-compare until identical
   (matching per-table rowcounts + checksums, and matching uploads file-count + checksum set).
4. **Operator flips** the real domain DNS/IP → florca.
5. **Client rebuild** with real `NEXT_PUBLIC_*` domain; server env → real domain + CORS + `COOKIE_DOMAIN`;
   deploy.
6. Verify prod (login, image upload/watermark, key flows).
7. **Rollback plan:** kotiko untouched — flip DNS/IP back if anything is wrong.

## Tooling boundaries (who does what)

- **coolify-ops** — provision/env/deploy on both Coolify instances (kotiko inventory, florca build).
  Multi-instance config already exists (kotiko + florca).
- **vps-check** — read-only health/verification on both hosts (`--host florca`).
- **server-ops** — the only kotiko mutation: optional maintenance/stop at the Phase-2 window
  (confirm-gated).
- **Direct SSH (assistant, authorized one-off)** — the raw `mysqldump | mysql` + `rsync` data copy,
  because it is outside the typed agent catalogs. Every command shown and confirmed before running.

## Open items / risks

- **sharp/CPU (Step 0)** — RESOLVED: not a blocker, needs a one-time GLOW build tweak (Alpine base, or
  pin sharp, or build-from-source) because GLOW is glibc-slim + sharp ≥0.33 on florca's sub-v2 CPU.
- **florca capacity** — healthy now (7.6 GiB avail, ~181 GB disk free); GLOW + its MySQL/Redis must fit
  alongside existing florca tenants (mshenebeli etc.). Re-check headroom after provisioning.
- **Data drift between Phase 1 copy and Phase 2 cutover** — resolved by the Phase-2 final re-sync +
  compare; that's why the compare step is mandatory and repeated until identical.
- **`NEXT_PUBLIC` double-build** — expected, documented above; not a surprise at cutover.
