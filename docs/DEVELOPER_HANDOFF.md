# Glow.GE: Developer Handoff: Waitlist, Faces, Booking, Payments

This document describes the features added on top of the existing Glow.GE platform: the
**Waitlist**, the **Faces** model catalog, the **Booking / slots** system with master-configured
**payment modes**, and the **Flitt** online-payment integration, plus the security hardening pass
and the legal/payment model. It is written for a developer taking over the work.

> Status legend used below: **DONE** (built, typechecks, unit-tested), **CONFIG** (needs values, no
> code change), **PENDING** (not done / needs a live test). Be careful with PENDING items: nothing
> involving real card money has been run end-to-end against a live gateway yet.

---

## 1. Stack (unchanged)

- **Server:** Fastify 5 + Prisma 6 (MySQL `glow_db`) + Redis + BullMQ. Runs as `api.glow.ge`
  (PM2 cluster). Module pattern: `routes -> controller -> service -> repo -> schemas`. Unified
  responses via `successResponse` / `paginatedResponse`. Typed `AppError` subclasses + one global
  error handler. Guards: `authenticate`, `authorize(...roles)`, `requirePhoneVerified` from
  `@/libs/auth`. SMS/OTP rails: `sendOtp` / `verifyOtp` / `sendSms` from `@/libs/otp` (gosms.ge).
- **Client:** Next.js 16 (App Router, Turbopack) + React 19 + Redux (auth only) + TanStack Query +
  axios (httpOnly cookies, `withCredentials`) + Tailwind v4 / shadcn. Custom i18n (ka default, plus
  ru / en) in `client/src/i18n/dictionaries/{ka,ru,en}.json`. Conventions live in
  `.claude/rules/` (read them before extending).
- **Auth:** httpOnly cookies (`accessToken` / `refreshToken`); no tokens in JS. Roles include
  `MASTER`, `MODEL`, `ADMIN`, `USER`.

---

## 2. Feature: Waitlist  (DONE)

**Purpose.** When a master has no free time, a client leaves their name + phone (SMS-verified) and is
notified when a slot opens. Public, no client account required (guest pattern with a verified phone).

**Flow.** Client opens `/w/<username>` -> fills name, `+995` phone, date, optional service/time,
consent -> requests an SMS OTP -> enters the code -> a `WaitlistEntry` is created. The master sees
entries in the dashboard and moves them through statuses.

**DB.** `WaitlistEntry` model in `prisma/schema.prisma` (client name/phone, `phoneVerified`,
requestedDate, serviceName?, preferredTime?, note?, `status` = WAITING|NOTIFIED|CONVERTED|CANCELLED|EXPIRED).

**Server endpoints** (`/api/v1/waitlist`):
- `GET  /public/:username/services`: master display name + services list.
- `POST /public/:username/request-otp`: send SMS OTP (rate-limited).
- `POST /public/:username/join`: verify OTP + create the entry (rate-limited).
- `GET  /me`: master: paginated own entries (auth + MASTER + phone-verified).
- `GET  /me/summary`: per-day counts.
- `PATCH /me/:id/status`: master updates an entry status.

**Client.** `features/waitlist/` (service, hooks, types) + components `JoinWaitlistForm`,
`MasterWaitlistBoard`, `ShareWaitlistLink`. The master board now lives as a **tab** inside
`/dashboard/bookings` (see Booking). The standalone `/dashboard/waitlist` page still works but is no
longer linked in the nav.

---

## 3. Feature: Faces (model catalog)  (DONE)

**Purpose.** People who want to be photo/treatment models self-register (role `MODEL`), upload photos,
and appear in a public catalog. Masters browse and express interest ("like"); on interest, the
model's contact is revealed. Photos and profiles are moderated by an admin.

**Flow.** A user signs up as a model (SMS-verified) -> uploads photos (with a blur option) ->
requests review -> an admin approves/rejects the profile and individual photos -> the profile shows
in the catalog. A master opens a face, expresses interest, and gets the contact. Models can blur /
unblur photos and withdraw from the catalog.

**DB.** Face profile + face photo models in `prisma/schema.prisma` (see the `faces` module for exact
fields). Role `MODEL` on the user.

**Server endpoints** (`/api/v1/faces`):
- Public/browse: `GET /catalog`, `GET /:id`, `POST /:id/interest`, `GET /interest/status`.
- Model self-service (auth): `GET /me`, `POST /photos`, `DELETE /photos/:photoId`,
  `POST /photos/:photoId/primary`, `POST /request-review`, `POST /blur`, `POST /unblur`,
  `POST /withdraw`.
- Admin moderation: `GET /admin/pending`, `POST /admin/:userId/review`,
  `POST /admin/photos/:photoId/review`.

**Client.** `features/faces/` + routes `/faces`, `/faces/[id]`, `/faces/join`, and the model dashboard
`/dashboard/model`.

---

## 4. Feature: Booking + slots + payment modes  (DONE)

**Purpose.** Clients see a master's **free time slots** in a shadcn UI and book one. A booked slot
disappears for the next client. Each master configures whether a prepayment is required.

### 4.1 Master configuration (drives the slots)

On `MasterProfile` (in `prisma/schema.prisma`):
- `bookingEnabled` (Boolean): master accepts online bookings.
- `workingHours` (JSON): 7 lowercase weekday keys (`monday`..`sunday`), each an array of
  `{ open: "HH:MM", close: "HH:MM" }` (up to 4 intervals/day; `null` = closed).
- `services` (JSON array): each service has `name`, `price`, `category`, optional `duration`
  (minutes, drives slot length; default 60 if absent), `priceType`, `description`.
- `bookingPaymentMode` (String): `NONE` | `DEPOSIT` | `FULL`.
- `bookingPrepaymentAmount` (Int?): deposit amount in whole GEL (used when mode = DEPOSIT; default 20).
- `bookingPaymentInfo` (String?): free-text pay-to instructions shown to the client (off-platform path).

The master sets all of this in **`/dashboard/bookings` -> Settings tab** (working-hours editor,
per-service duration, payment-mode selector + deposit amount + instructions). It persists via the
existing `PUT /api/v1/profiles/me` (partial update; only the sent fields change).

### 4.2 Slot engine

Pure function `computeSlots` in `server/src/modules/booking/booking.service.ts` (unit-tested):
for the chosen date's weekday, take each `workingHours` interval, step by the service duration, drop
candidates that overflow the interval, overlap an existing PENDING/CONFIRMED booking, or are already
past (Tbilisi UTC+4). Returns the free `"HH:MM"` start times. `dayClosed` = no intervals that day.

### 4.3 Booking lifecycle

`Booking` model: `masterProfileId`, client name/phone (`phoneVerified`), `serviceName`,
`durationMinutes` (snapshot), `date` (DATE), `startTime`/`endTime` ("HH:MM"),
`status` (PENDING|CONFIRMED|CANCELLED|COMPLETED|NO_SHOW), `paymentMode` (snapshot),
`prepaymentRequired`, `prepaymentAmount` (the charged amount: deposit OR full service price),
`depositStatus` (NONE|AWAITING|RECEIVED), `note?`. Unique `(masterProfileId, date, startTime)` so a
double-book races to a `SLOT_TAKEN` conflict.

- Mode `NONE`: booking is created `CONFIRMED`, the master gets an SMS.
- Mode `DEPOSIT` / `FULL`: booking is created `PENDING` + `depositStatus = AWAITING`. Amount =
  deposit amount (DEPOSIT) or the service price (FULL). Then payment is required (see Flitt below).

### 4.4 Server endpoints (`/api/v1/booking`)

- `GET  /public/:username/services`: payment mode + deposit amount + services (with duration/price).
- `GET  /public/:username/slots?date=YYYY-MM-DD&serviceName=...`: free slots + dayClosed + duration.
- `POST /public/:username/request-otp`: validate the slot is free, then send SMS OTP (rate-limited).
- `POST /public/:username/book`: verify OTP, create the booking, and (if prepay) start payment.
  Returns the booking + `redirectUrl` (the Flitt checkout URL, or `null` for no-prepay / off-platform).
- `POST /payment/callback`: **Flitt server-to-server webhook** (public, signature-verified, no auth).
- `GET  /me` / `GET /me/summary`: master: own bookings + per-day counts.
- `PATCH /me/:id/status`: master: CONFIRM / CANCEL / COMPLETE / NO_SHOW (SMS client on confirm/cancel).
- `POST /me/:id/deposit-received`: master: mark an off-platform deposit received (sets RECEIVED + CONFIRMED).

### 4.5 Client

`features/booking/` (service, hooks `useBooking` / `useMyBookings` / `useBookingSettings`, types).
- Public flow: `/w/[username]` -> `BookingFlow` (service select -> shadcn `Calendar` day pick ->
  free-slot `Button` chips via `SlotGrid` -> name + `+995` phone + consent -> `OtpInput` -> book).
  If the response has `redirectUrl`, the browser is sent to the Flitt checkout; otherwise the success
  screen shows (with the deposit/full pay-to notice on the off-platform path). If a day has no free
  slots, the client can fall back to the waitlist form.
- Master: `/dashboard/bookings` with three tabs: **Bookings** (`MasterBookingsBoard`: confirm /
  complete / no-show / cancel / mark-deposit-received), **Waitlist** (reused board), **Settings**
  (`BookingSettingsPanel` = `WorkingHoursEditor` + `ServiceDurations` + payment-mode controls).
- `/booking/return`: the page Flitt redirects the browser to after payment (neutral "confirming"
  message; the real confirmation is the webhook).

---

## 5. Feature: Flitt online payment  (DONE in code, PENDING live test)

**Provider:** Flitt (ex-Fondy), `https://docs.flitt.com`. The acquirer settles to the **aiNOW
company account**, and aiNOW distributes to masters (this is the model the bank confirmed; see the
legal note in section 9).

### 5.1 Flow

```
client books (mode DEPOSIT/FULL)
  -> server creates a Booking (PENDING) + a Payment (PENDING)
  -> server calls Flitt "create checkout" -> gets checkout_url
  -> book() returns { ...booking, redirectUrl: checkout_url }
  -> client browser is redirected to the Flitt checkout page (window.location)
  -> client pays by card on Flitt
  -> Flitt POSTs a server-to-server callback to /api/v1/booking/payment/callback
       -> verify signature -> verify amount -> if order_status == "approved":
            Payment = PAID, Booking = CONFIRMED, depositStatus = RECEIVED, SMS both parties
       -> if declined/expired/reversed (or amount mismatch): Payment = FAILED, Booking = CANCELLED
            (the slot is released)
  -> Flitt also redirects the browser to /booking/return (informational only)
```

The booking auto-confirms on the **verified webhook**, never on a manual click.

### 5.2 Adapter (`server/src/libs/flitt.ts`)

- `POST {FLITT_API_URL}` with body `{ "request": { version, order_id, merchant_id, order_desc,
  amount, currency, response_url, server_callback_url, signature } }`. `amount` is in **coins**
  (GEL x 100). Response: `{ "response": { response_status: "success", checkout_url } }`.
- **Signature** = `sha1( secret_key | non-empty-param-values-sorted-by-key, joined by "|" )`,
  lowercase. `signature` and `response_signature_string` are excluded. This recipe is **locked by a
  unit test** against the documented example (`server/src/libs/flitt.test.ts`).
- `verifyFlittCallback(body)` recomputes the signature over the callback params (constant-time
  compare). `isFlittApproved` / `isFlittTerminalFailure` read `order_status`.
- `isFlittConfigured()` = merchant id + secret key present. **If not configured, prepay bookings fall
  back to the off-platform path automatically** (booking PENDING/AWAITING, master marks received) so
  nothing breaks before Flitt is wired.

### 5.3 Payment model

`Payment` (one per booking, `bookingId` unique): `provider` ("flitt"), `amount` (whole GEL),
`currency`, `status` (PENDING|PAID|FAILED), `flittPaymentId?`. The Flitt `order_id` we send is the
`Payment.id`, so the webhook looks the payment up by it.

### 5.4 Robustness already handled

- Webhook signature verification + amount check + **idempotency** (a duplicate callback for an
  already-PAID payment is ignored).
- A dependency-free `application/x-www-form-urlencoded` body parser is registered in
  `server/src/app.ts`, so the callback parses whether Flitt sends JSON or form-encoded.
- The callback unwraps a `{ "response": {...} }` envelope if present.

---

## 6. Database migrations (apply in order)

All migrations are hand-authored SQL that matches `prisma migrate diff` output (byte-verified). On
deploy, run `npx prisma migrate deploy` then `npx prisma generate`. Do **not** `migrate reset` in
production.

1. `20260627171700_add_waitlist_faces_seller`: Waitlist + Faces (+ seller) tables.
2. `20260627190000_add_booking`: `Booking` table + 4 booking columns on `master_profiles`.
3. `20260628120000_add_booking_payment_mode`: replaces `bookingPrepaymentEnabled` with
   `bookingPaymentMode` on `master_profiles`; adds `paymentMode` to `bookings`.
4. `20260628130000_add_payment`: `payments` table.

---

## 7. Environment variables

Set in `server/.env` (template in `server/.env.example`):

| Var | Purpose |
|-----|---------|
| `OTP_API_KEY` | gosms.ge key for SMS OTP + notifications. |
| `APP_URL` | Public client URL (e.g. `https://glow.ge`); used for the Flitt `response_url`. |
| `PUBLIC_SERVER_URL` | Public URL of THIS API (e.g. `https://api.glow.ge`); used for the Flitt `server_callback_url`. |
| `FLITT_MERCHANT_ID` | Flitt merchant id (integer). `0` = gateway off -> off-platform fallback. |
| `FLITT_SECRET_KEY` | Flitt payment (secret) key for signing. |
| `FLITT_API_URL` | Defaults to `https://pay.flitt.com/api/checkout/url/`. |
| `PAYMENTS_ENABLED` | Existing kill-switch for paid credit/subscription grants (unrelated to booking deposits). |
| `CORS_ORIGIN` | Client origin(s) for CORS. |

Client uses `NEXT_PUBLIC_API_BASE_URL` (already configured).

---

## 8. Security hardening pass (DONE)

A full system bug audit was done; critical/high/medium issues across the app were fixed. Notable:
- Free credit / subscription grants are gated behind `PAYMENTS_ENABLED` so production never grants
  paid value for free until a real gateway is wired.
- Public booking/waitlist/faces endpoints are rate-limited; OTP-gated where a phone is collected.
- The booking double-book is guarded by a DB unique constraint mapped to a `SLOT_TAKEN` 409.
- The Flitt webhook is signature-verified, amount-checked, and idempotent.
- `Next.js 16` renamed middleware to `proxy`; `proxy.ts` is the active middleware (do not delete it
  thinking it is dead code).

---

## 9. Legal / payment model (read before going live with card payments)

The platform is a SaaS tech intermediary; historically client money did **not** pass through it (see
`docs/legal/bank-response.md` and the master agreement `docs/legal/master-service-agreement-ge.md`
Art. 3.1). Flitt settles to the **aiNOW account** ("settlement only to your account, then you
distribute"), which means client money now transits aiNOW. A Georgian-law review
(`agents/jurist/...` summary; the request letter is `docs/legal/bank-request-acquiring-ge.md`)
concluded:

- This does not automatically make aiNOW a payment-service provider **only if** aiNOW is structured
  as the **commercial agent of the master (payee side only)** with a written collection mandate
  (Payment Services Law exemption). Otherwise routing client funds for both sides risks a National
  Bank PSP-registration obligation. **Confirm the structure with the National Bank, not just the
  bank.**
- The online prepayment is a **distance contract**: the client has a 14-day withdrawal right and must
  be refunded within 14 days (Consumer Rights Law). FULL prepayment increases refund exposure. A
  refund flow must exist.
- **Before go-live:** amend the master contract Art. 3.1, the terms of service, and the refund policy
  to reflect the real money flow + the agency mandate; build the refund path.

> Until that is in place, keep `FLITT_*` unset so bookings use the off-platform deposit path.

---

## 10. Go-live checklist

1. **Migrations:** `npx prisma migrate deploy` + `npx prisma generate` on the server.
2. **Flitt config:** set `FLITT_MERCHANT_ID`, `FLITT_SECRET_KEY`, `PUBLIC_SERVER_URL`, `APP_URL`.
   Confirm the merchant is active for GEL e-commerce.
3. **Master setup (per master):** enable booking + set working hours + per-service durations +
   payment mode (and deposit amount if DEPOSIT) in `/dashboard/bookings -> Settings`.
4. **Legal (section 9):** agency mandate + National Bank confirmation + contract/ToS/refund updates.
5. **SMS sender:** register the SMS sender name with gosms.ge (see Known issues).

---

## 11. Known issues / PENDING (do not skip)

- **PENDING (Flitt live test):** no real sandbox transaction has been run. Verify in the Flitt
  sandbox: (a) the actual callback content-type (JSON vs form-encoded; both are handled), (b) the
  `{response:{}}` envelope on the callback, (c) the signature matches on real callback params,
  (d) refund / partial-refund handling. Do not announce "payments work" until this passes.
- **OTP verification depth:** `verifyOtp` in `server/src/libs/otp.ts` treats any non-error HTTP
  response as success. Confirm gosms.ge returns a non-2xx on a bad code; if it returns 200 with a
  `success: false` body, add a body-level check (`if (result?.success === false) throw ...`).
- **SMS sender name:** sending as `from: 'GLOW'` can fail with a gosms "invalid sender name" error if
  the sender is not registered. Register it (or use an approved sender) before relying on SMS.
- **Abandoned prepaid bookings:** a PENDING (awaiting payment) booking holds its slot until the
  webhook confirms or fails. Flitt order lifetime + a periodic sweep of stale PENDING payments would
  release slots faster (currently relies on the terminal-failure callback).
- **Postman:** the repo does not maintain a Postman collection for these modules (matches the
  existing convention). Add one if your team uses Postman.

---

## 12. File map

**Server**
- `src/modules/booking/`: booking module (routes, controller, service incl. `computeSlots` +
  `handlePaymentCallback`, repo, schemas, tests).
- `src/modules/waitlist/`, `src/modules/faces/`: the other two features.
- `src/libs/flitt.ts` (+ `flitt.test.ts`): Flitt adapter + signature.
- `src/libs/otp.ts`: gosms SMS/OTP.
- `src/modules/profiles/`: `bookingPaymentMode` + the booking config fields on the profile.
- `src/config/env.ts`: env schema (Flitt vars added).
- `src/app.ts`: plugin + route registration, the urlencoded parser.
- `prisma/schema.prisma` + `prisma/migrations/`: models + migrations.

**Client**
- `src/features/booking/`: service, hooks, types, components (`BookingFlow`, `SlotGrid`,
  `MasterBookingsBoard`, `BookingSettingsPanel`, `WorkingHoursEditor`, `ServiceDurations`).
- `src/features/waitlist/`, `src/features/faces/`.
- `src/app/w/[username]/` (booking flow), `src/app/booking/return/`,
  `src/app/(main)/dashboard/bookings/`, faces routes.
- `src/i18n/dictionaries/{ka,ru,en}.json`: `booking.*`, `waitlist.*`, `faces.*`, `nav.*` keys.
- `src/lib/constants/api-endpoints.ts` + `routes.ts`.

**Docs / legal**
- `docs/legal/bank-request-acquiring-ge.md`: the letter to the bank (Flitt acquiring request).
- `docs/legal/bank-response.md`, `docs/legal/master-service-agreement-ge.md`: prior filings.
- `.claude/rules/`: server + client coding conventions (follow them when extending).
