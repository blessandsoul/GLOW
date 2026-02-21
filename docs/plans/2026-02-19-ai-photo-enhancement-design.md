# AI Photo Enhancement — Design Document

**Date**: 2026-02-19
**Status**: Approved

## Overview

AI-powered photo enhancement for beauty professionals (lashes, hair, nails, makeup and more) directly on the Glow.GE platform. Instead of selling prompts once, we monetize each photo processing via a credit system.

## Business Model: Freemium + Credits

- **Free on signup**: 3 credits
- **Referral bonuses**: +3 (referrer) / +1 (referred) — already implemented
- **Credit packages**: Starter (10/$3), Popular (50/$12), Pro (100/$20)
- **PRO subscription**: unlimited processing (future)

## Processing Types

| Type | Code | Cost | Description |
|------|------|------|-------------|
| Enhance | `ENHANCE` | 1 credit | Auto lighting, color correction, sharpness |
| Retouch | `RETOUCH` | 2 credits | Skin retouch, remove defects, smooth texture |
| Background | `BACKGROUND` | 2 credits | Replace/blur background, studio background |
| Pro Edit | `PRO_EDIT` | 3 credits | All combined: retouch + background + color + enhance |

## Database Changes

### Modify `Job` model

```prisma
processingType  String   @default("ENHANCE")   // ENHANCE | RETOUCH | BACKGROUND | PRO_EDIT
creditCost      Int      @default(1)            // 1, 2, 2, 3
```

### New `CreditPackage` model

```prisma
model CreditPackage {
  id        String   @id @default(uuid())
  name      String
  credits   Int
  price     Int                             // cents
  currency  String   @default("USD")
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  @@map("credit_packages")
}
```

### New `CreditPurchase` model

```prisma
model CreditPurchase {
  id        String   @id @default(uuid())
  userId    String
  packageId String
  credits   Int
  amount    Int                              // cents
  currency  String   @default("USD")
  status    String   @default("COMPLETED")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId])
  @@map("credit_purchases")
}
```

## Server Changes

### New module: `credits/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/credits/balance` | Current balance + totals |
| `GET` | `/credits/packages` | Available packages |
| `POST` | `/credits/purchase` | Buy package (mock) |
| `GET` | `/credits/history` | Transaction history (paginated) |

### Modified module: `jobs/`

- Check credit balance before job creation
- Deduct credits atomically
- Record `CreditTransaction` with `reason: 'JOB_PAYMENT'`
- Save `processingType` and `creditCost` on Job

### Cost mapping

```typescript
const PROCESSING_COSTS: Record<string, number> = {
  ENHANCE: 1,
  RETOUCH: 2,
  BACKGROUND: 2,
  PRO_EDIT: 3,
};
```

## Client Changes

### New component: `ProcessingTypeSelector.tsx`

- 4 cards with type description and credit cost
- Shows current balance
- Disabled state when insufficient credits + CTA "Buy credits"

### Modified: `UploadSection.tsx`

- Add processing type selection step before upload
- Pass `processingType` in settings
- Show cost next to "Process" button

### New/Updated page: `dashboard/credits/`

- 3 package cards with pricing
- "Popular" highlighted as recommended
- Mock purchase flow
- Transaction history table

## User Flow

```
Upload photo → Select processing type → See cost + balance
→ Click "Process for N credits" → Server checks balance → Deducts → Creates job
→ Processing (4s mock) → Result ready → Download / Add to portfolio

If insufficient credits:
→ "Not enough credits" → "Buy credits" button → Packages page
→ Mock purchase → Credits added → Return to upload
```
