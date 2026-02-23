# GLOW Server — Full Build Plan

## Context

The GLOW client has all features built with mock/in-memory services. The server has 5 modules done (auth, jobs, credits, showcase, referrals) but is missing several modules and has gaps in existing ones. This plan covers **everything** needed to make the server fully functional, with AI/generation left for last.

---

## What's Already Built (Server)

| Module | Status | Notes |
|--------|--------|-------|
| Auth | Partial | register, login, refresh, logout, me — missing: password-reset, change-password |
| Jobs | Done (mock AI) | single, batch, guest, list, get, download — AI processing is simulated |
| Credits | Done | balance, packages, purchase, history |
| Showcase | Done | get showcase, submit review |
| Referrals | Done | my stats |
| Shared infra | Done | errors, responses, auth middleware, prisma, redis, logger, queue, email, watermark |

---

## What Needs to Be Built

### Schema Fixes (Migration)

The User model is missing fields the client expects:

| Field | Client expects | Server has | Action |
|-------|---------------|------------|--------|
| `avatar` | `avatar?: string` | Missing | Add `avatar String? @db.VarChar(1000)` |
| `isEmailVerified` | `isEmailVerified` | `emailVerified` | Ensure `getMe` returns it as `isEmailVerified` in the response |
| `username` | Used for public portfolio `/p/:username` | `username String? @unique` | Already exists |

Also need to add `language` field to `Caption` model (client expects `language: 'RU' | 'EN' | 'KA'`):

```prisma
model Caption {
  ...
  language  String    // 'RU', 'EN', 'KA' — currently missing from schema
  ...
}
```

**Migration**: `add_avatar_and_caption_language`

---

## Workflow Per Step

Every step follows the same cycle:

```
Server Build → Server Verify → Client Integrate → Playwright E2E Test
```

1. **Server Build** — implement the server module (routes, controller, service, repo, schemas)
2. **Server Verify** — start server, test endpoints via Postman/curl, check DB via Prisma Studio
3. **Client Integrate** — rewire the corresponding mock service to use real API calls, update `api-endpoints.ts`
4. **Playwright E2E Test** — write and run Playwright tests that exercise the full flow (client → server → DB → response → UI update) to confirm the feature is 100% working and bug-free

> **Do NOT move to the next step until Playwright tests pass for the current step.**

### Playwright Test Structure

```
client/e2e/
├── auth.spec.ts           — Steps 1, 3
├── users.spec.ts          — Step 2
├── profile.spec.ts        — Step 4
├── branding.spec.ts       — Step 5
├── portfolio.spec.ts      — Step 6
├── trends.spec.ts         — Step 7
├── credits.spec.ts        — Step 9
└── helpers/
    ├── auth.helper.ts     — login/register utilities reused across specs
    └── api.helper.ts      — direct API helpers for test setup/teardown
```

Each spec should cover:
- **Happy path** — feature works as expected end-to-end
- **Validation errors** — server rejects bad input, client shows error
- **Auth guard** — protected routes redirect unauthenticated users
- **Edge cases** — empty states, duplicate submissions, concurrent requests

---

## Build Steps (in order)

### Step 1: Schema Migration + User Field Fixes

**Files:**
- `server/prisma/schema.prisma` — add `avatar` to User, add `language` to Caption
- `server/src/modules/auth/auth.repo.ts` — include `avatar`, `username` in select; map `emailVerified` → `isEmailVerified`

**What to do:**
1. Add `avatar String? @db.VarChar(1000)` to User model
2. Add `language String` to Caption model
3. Run migration: `npm run prisma:migrate dev --name add_avatar_caption_language`
4. Update `findUserById` and `createUser` selects to include `avatar` and `username`
5. Ensure the user object returned maps `emailVerified` to `isEmailVerified` for client compatibility

---

### Step 2: Users Module (NEW)

**Endpoints the client needs:**
- `PATCH /api/v1/users/me` — update name, avatar
- `DELETE /api/v1/users/me` — soft-delete account
- `POST /api/v1/users/me/avatar` — upload avatar image

**Files to create:**
```
server/src/modules/users/
├── users.routes.ts
├── users.controller.ts
├── users.service.ts
├── users.repo.ts
└── users.schemas.ts
```

**Details:**

**`PATCH /users/me`** (authenticated)
- Input: `{ firstName?, lastName? }` — validated with Zod
- Service: update user fields, return updated user
- Response: `successResponse('Profile updated', user)`

**`DELETE /users/me`** (authenticated)
- Input: none (user from JWT)
- Service: soft-delete (set `deletedAt`, `isActive: false`), clear all refresh tokens, clear cookies
- Response: `successResponse('Account deleted', null)`

**`POST /users/me/avatar`** (authenticated)
- Input: multipart file upload (JPEG, PNG, WebP, max 5MB)
- Service: save file (local for now, S3 later), update `avatar` field on user
- Response: `successResponse('Avatar updated', { avatarUrl })`

**Register in:** `server/src/app.ts` → `app.register(usersRoutes, { prefix: '/api/v1/users' })`

---

### Step 3: Auth Module Completion

**Missing endpoints:**

**`POST /auth/request-password-reset`**
- Input: `{ email: string }`
- Service: generate reset token, store hashed version + expiry, send email with reset link
- Requires: add `passwordResetToken String?` and `passwordResetExpiry DateTime?` to User model
- Response: `successResponse('Reset email sent', null)` (always, even if email doesn't exist — security)

**`POST /auth/reset-password`**
- Input: `{ token: string, password: string }`
- Service: validate token + expiry, hash new password, update user, clear token
- Response: `successResponse('Password reset successful', null)`

**`POST /auth/change-password`** (authenticated)
- Input: `{ currentPassword: string, newPassword: string }`
- Service: verify current password, hash new password, update, revoke all refresh tokens
- Response: `successResponse('Password changed', null)`

**Files to modify:**
- `server/prisma/schema.prisma` — add password reset token fields to User
- `server/src/modules/auth/auth.routes.ts` — add routes
- `server/src/modules/auth/auth.controller.ts` — add handlers
- `server/src/modules/auth/auth.service.ts` — add methods
- `server/src/modules/auth/auth.repo.ts` — add queries
- `server/src/modules/auth/auth.schemas.ts` — add Zod schemas

**Migration**: `add_password_reset_tokens`

---

### Step 4: Profile Module (NEW) — Master Profile CRUD

**Endpoints:**
- `GET /api/v1/profiles/me` — get current user's master profile (authenticated)
- `PUT /api/v1/profiles/me` — create or update master profile (authenticated)

**Files to create:**
```
server/src/modules/profiles/
├── profiles.routes.ts
├── profiles.controller.ts
├── profiles.service.ts
├── profiles.repo.ts
└── profiles.schemas.ts
```

**Details:**

**`GET /profiles/me`** (authenticated)
- Service: find MasterProfile by userId, return null if not exists
- Response: `successResponse('Profile retrieved', profile)` (data can be null)

**`PUT /profiles/me`** (authenticated)
- Input (Zod):
  ```typescript
  {
    city?: string,
    niche?: string,
    bio?: string,
    phone?: string,
    whatsapp?: string,
    telegram?: string,
    instagram?: string,
    services?: Array<{ name: string, price: number, currency: string, category: string }>
  }
  ```
- Service: upsert MasterProfile (create if not exists, update if exists)
- Response: `successResponse('Profile saved', profile)`

**Register in:** `server/src/app.ts`

---

### Step 5: Branding Module (NEW)

**Endpoints:**
- `GET /api/v1/branding/me` — get branding profile (authenticated)
- `PUT /api/v1/branding/me` — create/update branding (authenticated, multipart for logo)
- `DELETE /api/v1/branding/me` — delete branding (authenticated)

**Files to create:**
```
server/src/modules/branding/
├── branding.routes.ts
├── branding.controller.ts
├── branding.service.ts
├── branding.repo.ts
└── branding.schemas.ts
```

**Details:**

**`GET /branding/me`** (authenticated)
- Service: find BrandingProfile by userId
- Response: `successResponse('Branding retrieved', profile)` (data can be null)

**`PUT /branding/me`** (authenticated, multipart)
- Input: `displayName?, instagramHandle?, primaryColor, watermarkStyle, logo? (file)`
- Service: upsert BrandingProfile; if logo file provided, save it and store URL
- Response: `successResponse('Branding saved', profile)`

**`DELETE /branding/me`** (authenticated)
- Service: delete BrandingProfile, delete logo file
- Response: `successResponse('Branding deleted', null)`

**Register in:** `server/src/app.ts`

---

### Step 6: Portfolio Module (NEW)

**Endpoints:**
- `GET /api/v1/portfolio/me` — list user's portfolio items (authenticated)
- `POST /api/v1/portfolio` — add item (authenticated)
- `PATCH /api/v1/portfolio/:id` — update item (authenticated, owner only)
- `DELETE /api/v1/portfolio/:id` — delete item (authenticated, owner only)
- `GET /api/v1/portfolio/public/:username` — get public portfolio (public)

**Files to create:**
```
server/src/modules/portfolio/
├── portfolio.routes.ts
├── portfolio.controller.ts
├── portfolio.service.ts
├── portfolio.repo.ts
└── portfolio.schemas.ts
```

**Details:**

**`GET /portfolio/me`** (authenticated)
- Service: find all PortfolioItems by userId, ordered by sortOrder
- Response: `successResponse('Portfolio retrieved', items)`

**`POST /portfolio`** (authenticated)
- Input: `{ imageUrl, title?, niche?, isPublished?, jobId? }`
- Service: create PortfolioItem, auto-set sortOrder
- Response: `successResponse('Item added', item)`

**`PATCH /portfolio/:id`** (authenticated)
- Input: `{ title?, niche?, isPublished?, sortOrder? }`
- Service: verify ownership, update item
- Response: `successResponse('Item updated', item)`

**`DELETE /portfolio/:id`** (authenticated)
- Service: verify ownership, delete item
- Response: `successResponse('Item deleted', null)`

**`GET /portfolio/public/:username`** (public)
- Service: find user by username, get their published portfolio items, master profile, branding, reviews aggregate
- Response: `successResponse('Portfolio retrieved', publicData)`
- Returns `PublicPortfolioData`:
  ```typescript
  {
    username, displayName, bio, instagram, city, niche,
    services: [...], items: [...], reviewsCount, averageRating
  }
  ```

**Register in:** `server/src/app.ts`

---

### Step 7: Trends Module (NEW)

**Endpoints:**
- `GET /api/v1/trends/current` — list active trends for current week (public)
- `GET /api/v1/trends/archive` — list past trends (authenticated)

**Files to create:**
```
server/src/modules/trends/
├── trends.routes.ts
├── trends.controller.ts
├── trends.service.ts
├── trends.repo.ts
└── trends.schemas.ts
```

**Details:**

**`GET /trends/current`** (public)
- Service: find TrendTemplates where `isActive = true`, ordered by sortOrder
- Response: `successResponse('Trends retrieved', trends)`

**`GET /trends/archive`** (authenticated)
- Service: find TrendTemplates where `isActive = false`, ordered by weekOf desc
- Response: `successResponse('Archive retrieved', trends)`

**Register in:** `server/src/app.ts`

---

### Step 8: File Upload Infrastructure

Currently jobs store placeholder URLs (`picsum.photos`). Need a real file storage system.

**Approach: Local storage first** (easy to swap for S3 later)

**Files to create:**
```
server/src/libs/storage.ts          — upload/delete/getUrl functions
server/uploads/                     — local upload directory (gitignored)
```

**Details:**
- `uploadFile(file: MultipartFile, folder: string): Promise<string>` — saves to `uploads/{folder}/{uuid}.{ext}`, returns relative URL
- `deleteFile(url: string): Promise<void>` — deletes file from disk
- `getFileUrl(relativePath: string): string` — returns full URL
- Serve static files: register `@fastify/static` for `/uploads/*`

**Integrate with:**
- Jobs module: save uploaded photos to `uploads/jobs/`
- Users module: save avatars to `uploads/avatars/`
- Branding module: save logos to `uploads/branding/`

**Env var:** `UPLOAD_DIR` (default: `./uploads`)

---

### Step 9: Seed Credit Packages

The client expects real credit packages from the server. Need to seed the `credit_packages` table.

**File:** `server/prisma/seed.ts`

**Packages to seed (matching client pricing):**

| ID | Name | Credits | Price (tetri) | Currency |
|----|------|---------|--------------|----------|
| `low-s` | Low S | 10 | 150 | GEL |
| `low-m` | Low M | 30 | 390 | GEL |
| `low-l` | Low L | 70 | 790 | GEL |
| `mid-s` | Mid S | 10 | 550 | GEL |
| `mid-m` | Mid M | 30 | 1490 | GEL |
| `mid-l` | Mid L | 70 | 2990 | GEL |
| `pro-s` | Pro S | 10 | 2190 | GEL |
| `pro-m` | Pro M | 30 | 5990 | GEL |
| `pro-l` | Pro L | 70 | 12900 | GEL |

---

### Step 10: Postman Collection

Per project conventions, every endpoint must have a Postman request.

**File:** `server/postman/collection.json`

**Folders:**
- Auth (No Auth): Register, Login, Refresh, Logout, Request Password Reset, Reset Password
- Auth (Protected): Get Me, Change Password
- Users: Update Me, Delete Me, Upload Avatar
- Profiles: Get My Profile, Save My Profile
- Branding: Get My Branding, Save My Branding, Delete My Branding
- Portfolio: My Portfolio, Add Item, Update Item, Delete Item, Public Portfolio
- Jobs: Upload Photo, Guest Upload, Batch Upload, List My Jobs, Get Job, Download Result
- Credits: Get Balance, Get Packages, Purchase Package, Get History
- Showcase: Get Showcase, Submit Review
- Referrals: My Stats
- Trends: Current Trends, Archive

---

### Step 11: Client Service Rewiring

Replace all mock client services with real API calls.

**Services to rewrite (currently mock → real API):**

| Client Service | Currently | Needs |
|---------------|-----------|-------|
| `credits.service.ts` | In-memory mock | Real API calls to `/credits/*` |
| `profile.service.ts` | In-memory mock | Real API calls to `/profiles/me` |
| `branding.service.ts` | In-memory mock | Real API calls to `/branding/me` |
| `portfolio.service.ts` | In-memory mock | Real API calls to `/portfolio/*` |
| `trend.service.ts` | Hardcoded mock | Real API calls to `/trends/*` |

**Components to wire up (currently setTimeout mocks):**
- `ProfileSetup.tsx` → `PersonalInfoSection.handleSave` → real `PATCH /users/me`
- `ChangePassword.tsx` → `handleSubmit` → real `POST /auth/change-password`
- `DeleteAccount.tsx` → `handleDelete` → real `DELETE /users/me`

**Client `api-endpoints.ts` additions:**
```typescript
USERS: {
  ME: '/users/me',
  AVATAR: '/users/me/avatar',
},
PROFILES: {
  ME: '/profiles/me',
},
BRANDING: {
  ME: '/branding/me',
},
PORTFOLIO: {
  ME: '/portfolio/me',
  CREATE: '/portfolio',
  UPDATE: (id: string) => `/portfolio/${id}`,
  DELETE: (id: string) => `/portfolio/${id}`,
  PUBLIC: (username: string) => `/portfolio/public/${username}`,
},
TRENDS: {
  CURRENT: '/trends/current',
  ARCHIVE: '/trends/archive',
},
AUTH: {
  // add to existing:
  CHANGE_PASSWORD: '/auth/change-password',
},
```

---

### Step 12 (LAST): AI & Generation Features

**Left for last.** These features need AI integration:

1. **Photo Enhancement (Jobs)** — replace mock 4-second delay with real AI processing
2. **Caption Generation** — call AI to generate multilingual captions (RU, EN, KA)
3. **Before-After Processing** — generate carousel/story images from before+after photos
4. **Story Generation** — generate story layouts (MINIMAL, GRADIENT, BOLD) from result images
5. **Retouch** — apply AI retouching based on user-marked points

**Server endpoints needed (will be planned separately):**
- `POST /api/v1/captions/generate` — generate captions for a job
- `GET /api/v1/captions/:jobId` — get captions for a job
- `POST /api/v1/jobs/:id/before-after` — create before-after job
- `POST /api/v1/stories/generate` — generate stories for a job
- `GET /api/v1/stories/:jobId` — get stories for a job
- `POST /api/v1/retouch` — submit retouch job

---

## Summary: Execution Order

| Step | What | Migration? | Client Integration | Playwright Tests |
|------|------|-----------|-------------------|-----------------|
| 1 | Schema fixes (avatar, caption language) | Yes | Update auth repo response mapping | `auth.spec.ts` — verify `getMe` returns correct fields |
| 2 | Users module (update, delete, avatar) | No | Wire `ProfileSetup`, `DeleteAccount` components | `users.spec.ts` — update name, upload avatar, delete account |
| 3 | Auth completion (password reset, change pwd) | Yes | Wire `ChangePassword` component, add reset pages | `auth.spec.ts` — change password, request/complete reset |
| 4 | Profile module (master profile CRUD) | No | Rewrite `profile.service.ts` → real API | `profile.spec.ts` — save/load profile, services CRUD |
| 5 | Branding module (CRUD + logo upload) | No | Rewrite `branding.service.ts` → real API | `branding.spec.ts` — save/load branding, logo upload |
| 6 | Portfolio module (CRUD + public view) | No | Rewrite `portfolio.service.ts` → real API | `portfolio.spec.ts` — add/edit/delete items, public view |
| 7 | Trends module (current + archive) | No | Rewrite `trend.service.ts` → real API | `trends.spec.ts` — list current trends, archive |
| 8 | File upload infra (local storage) | No | Update jobs to use real file URLs | Covered by existing job specs |
| 9 | Seed credit packages | No | Rewrite `credits.service.ts` → real API | `credits.spec.ts` — view packages, purchase, check balance |
| 10 | Postman collection | No | — | — |
| 11 | Full integration pass | No | Verify all services use real API | Run full Playwright suite, fix any remaining issues |
| 12 | AI/Generation (LAST) | TBD | TBD | TBD |

---

## Verification (per step)

Every step must pass this checklist before moving on:

### Server Verification
1. Start server: `cd server && npm run dev`
2. Test every new/modified endpoint via Postman or curl
3. Verify database state via `npm run prisma:studio`
4. Check error responses (invalid input, unauthorized, not found)

### Client Integration
5. Replace the corresponding mock service with real API calls
6. Update `api-endpoints.ts` with new endpoint constants
7. Manual smoke test: start client (`cd client && npm run dev`), click through the feature

### Playwright E2E
8. Write Playwright tests covering: happy path, validation errors, auth guards, edge cases
9. Run tests: `npx playwright test <spec-file>`
10. All tests must pass — **green suite required before proceeding to next step**
