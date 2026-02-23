# Client-Side Bugs & Issues Report

**Date**: 2026-02-23
**Tested by**: Playwright MCP automated testing
**Test user**: testbug@glow.ge / NewPass456

---

## Critical Bugs

### BUG-01: CORS missing PATCH/PUT/DELETE methods (FIXED)

- **Severity**: Critical (blocked all write operations)
- **Location**: `server/src/app.ts` — `@fastify/cors` config
- **Description**: The CORS plugin defaulted to `GET,HEAD,POST` methods only. All PATCH, PUT, and DELETE requests from the browser were blocked by CORS preflight.
- **Fix applied**: Added `methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']` to the cors config.

### BUG-02: Credits purchase returns 500 Internal Server Error

- **Severity**: Critical
- **Location**: Server — `POST /api/v1/credits/purchase`
- **Description**: Clicking any "Buy" button on the credits page triggers a 500 error. The server crashes when processing the purchase request. Toast shows "Request failed with status code 500".
- **Steps to reproduce**: Login → /dashboard/credits → Click any "შეძენა" (Buy) button.

---

## High-Priority Bugs

### BUG-03: Hydration mismatch on every page load

- **Severity**: High
- **Location**: `client/src/components/layout/Header.tsx` (and any page with auth-dependent UI)
- **Description**: SSR renders unauthenticated nav (Login/Register), then client hydrates with authenticated state after AuthInitializer calls `getMe()`. This causes a React hydration error: "Hydration failed because the server rendered HTML didn't match the client."
- **Impact**: Console errors on every page load. The UI visually flashes from unauthenticated to authenticated state (~2-3 seconds).
- **Root cause**: Redux store is empty during SSR. AuthInitializer runs client-side only.

### BUG-04: Auth state flash on hard navigation

- **Severity**: High
- **Location**: Auth flow / Header component
- **Description**: On every full page load (browser refresh, direct URL navigation), the nav shows Login/Register buttons for 2-3 seconds until AuthInitializer completes `getMe()`. Client-side navigation (clicking links) preserves auth state correctly.
- **Impact**: Poor UX — user sees unauthenticated state briefly on every page refresh.

### BUG-05: Change password causes ungraceful session logout

- **Severity**: High
- **Location**: `client/src/features/profile/components/ChangePassword.tsx`
- **Description**: After a successful password change, the server intentionally invalidates all sessions and clears cookies (correct security behavior). However, the client doesn't handle this gracefully. The next API call (or the change-password response itself since cookies are cleared mid-request) triggers a 401 → refresh fails → user is silently logged out and redirected to /login without any explanation.
- **Expected behavior**: After successful password change, show a message "Password changed successfully. Please log in again." and redirect to /login.
- **Steps to reproduce**: Login → /dashboard/profile → Change password → Observe being silently kicked to login.

---

## Medium-Priority Bugs

### BUG-06: Untranslated i18n keys — page titles

- **Severity**: Medium
- **Location**: Login/Register page metadata
- **Description**: Page title shows raw i18n keys instead of translated text.
- **Examples**:
  - Login page: `system.sys_4a6zcn | Glow.GE` (should be "Login | Glow.GE" or Georgian equivalent)
  - Other pages may have similar issues with `system.sys_o53sey`

### BUG-07: Untranslated i18n keys — profile city/niche dropdowns

- **Severity**: Medium
- **Location**: `client/src/features/profile/components/ProfileSetup.tsx` — City select
- **Description**: The city dropdown shows raw i18n keys instead of city names: `system.sys_ztyawf`, `system.sys_mmxyux`, `system.sys_wpm6qq`, etc.
- **Impact**: Users cannot tell which city they are selecting. The niche dropdown likely has the same issue.
- **Root cause**: The `CITIES` array in `profile.types.ts` likely contains i18n key references that aren't being resolved.

### BUG-08: Untranslated i18n keys — landing page upload section

- **Severity**: Medium
- **Location**: Landing page (`/`) — upload section
- **Description**: Several text elements show raw i18n keys:
  - `upload.style_title`
  - `upload.style_subtitle`
  - `upload.no_preset_tip`
  - `upload.sign_up_for_more`

### BUG-09: Russian text in portfolio page

- **Severity**: Medium
- **Location**: `client/src/features/portfolio/` — Portfolio page header
- **Description**: The "Copy portfolio link" button shows Russian text: "Скопировать ссылку на портфолио" instead of Georgian.

### BUG-10: Portfolio counter formatting bug

- **Severity**: Medium (cosmetic)
- **Location**: Portfolio page header
- **Description**: The counter shows "0 დან0 გამოქვეყნებულია" — missing space between "დან" and "0". Should be "0 დან 0 გამოქვეყნებულია".

### BUG-11: Duplicate site name in branding page title

- **Severity**: Low
- **Location**: Branding page metadata
- **Description**: Page title shows "Branding — Glow.GE | Glow.GE" — "Glow.GE" is duplicated.

---

## Low-Priority Bugs

### BUG-12: Landing page shows 0 credits for logged-in user

- **Severity**: Low
- **Location**: Landing page upload section — balance display
- **Description**: The upload section shows "ბალანსი: 0" even for a logged-in user with 3 credits. This is caused by BUG-03/BUG-04 (SSR renders without auth state). The landing page header also shows Login/Register instead of the authenticated nav.

### BUG-13: Password form autocomplete warning

- **Severity**: Low
- **Location**: Profile page — Change password section
- **Description**: Browser console shows: "Password forms should have (optionally hidden) username fields for accessibility". The password change form is missing a hidden username field for password manager compatibility.

---

## Integration Gaps

### GAP-01: No client-side page for Trends

- **Description**: Server has `GET /api/v1/trends/current` and `GET /api/v1/trends/archive` endpoints. Client has `TrendTemplatesPanel` component, `useTrends` hook, and `trend.service.ts` — but no dedicated page route (`/dashboard/trends` returns 404).
- **Status**: The trends panel is likely embedded in the upload/studio flow rather than being a standalone page. Verify this is intentional.

### GAP-02: No client-side page for Referrals

- **Description**: Server has `GET /api/v1/referrals/my` endpoint. Client has a nav link "რეფერალები" (Referrals) under Business dropdown pointing to `/dashboard/referrals`, but this route needs a page implementation.

### GAP-03: No client-side pages for Showcase

- **Description**: Server has `GET /api/v1/showcase/:jobId` and `POST /api/v1/showcase/:jobId/review` endpoints. No dedicated client page visible for showcase viewing/reviewing.

### GAP-04: Mocked AI services (expected — Step 12)

- **Description**: The following services are still fully mocked (not calling server):
  - `before-after.service.ts` — AI retouch processing
  - `retouch.service.ts` — Retouch submission
  - `captions.service.ts` — AI caption generation
  - `story.service.ts` — AI story generation
- **Status**: Expected. These are AI generation features planned for Step 12.

---

## What Works Correctly

| Feature | Status | Notes |
|---------|--------|-------|
| Register | OK | Creates account, redirects to dashboard |
| Login | OK | Sets httpOnly cookies, redirects |
| Logout | OK | Clears cookies, redirects to /login |
| Auth guards | OK | Protected routes redirect to /login?from=... |
| Save name (PATCH /users/me) | OK | Updates name, nav updates reactively |
| Master profile (PUT /profiles/me) | OK | Saves city, bio, phone, services |
| Change password (POST /auth/change-password) | OK | Changes password (but see BUG-05 for UX) |
| Branding save (PUT /branding/me) | OK | Saves brand name, IG handle, color, style |
| Branding preview | OK | Updates reactively with brand data |
| Portfolio page | OK | Lists empty state, has public link |
| Credits balance display | OK | Shows correct balance (3 credits) |
| Credits packages display | OK | Shows all plans and packages correctly |
| Transaction history | OK | Shows empty state correctly |
| Theme toggle | OK | Dark/light mode works |
| Client-side navigation | OK | Auth state persists, no flash |

---

## Test Environment

- **Client**: Next.js on http://localhost:3000
- **Server**: Fastify on http://localhost:4000
- **Database**: MySQL via Prisma
- **Browser**: Chromium (Playwright)
