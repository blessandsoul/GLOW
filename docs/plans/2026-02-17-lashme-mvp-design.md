# LashMe — MVP Design Document

**Date:** 2026-02-17
**Status:** Approved

---

## 1. Product Overview

LashMe is a SaaS tool for beauty masters (lash, nails, brows, etc.) that transforms their work photos into professional, sales-ready images using AI.

**Core loop:** Upload photo → AI generates 4 enhanced variants → Download best one.

**Problem solved:** Beauty masters struggle to produce high-quality, selling photos. AI prompts exist to fix this, but require technical knowledge. LashMe wraps that expertise into a one-click service.

---

## 2. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| AI provider | fal.ai (FLUX img2img) | Photo stays real (not fully generated) — critical for beauty niche. Cheap ($0.003–0.01/image), fast (3–8s). |
| Monetization | Credits (freemium) | 3 free credits on signup, then packs (10/$5, 50/$18, 100/$30). Low barrier, no subscription friction for MVP. |
| Payment | **Excluded from MVP** | Add Stripe post-MVP after validating willingness to pay. |
| Results access | Blur until registered | User uploads without auth, sees blurred results, must register to download. Shows value before friction. |
| Realtime updates | Polling (2s interval) | Simpler than WebSocket for MVP. Switch to WS later if needed. |

---

## 3. User Flow

```
[Homepage] → Drag & Drop photo (no auth required)
    → POST /api/v1/upload (anonymous → temp token)
    → Job created (status: pending)
    → Polling starts
    → fal.ai processes → 4 variants saved to R2/S3
    → Job status: done
    → Results shown (blurred if not authenticated)
    → "Register to download" modal
    → Register → 3 free credits assigned
    → Download consumes 1 credit per photo
```

---

## 4. Architecture

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) — already exists |
| Backend | Fastify (to create) |
| AI | fal.ai API — FLUX img2img, 4 variants per job |
| Storage | Cloudflare R2 (or AWS S3) |
| Database | MySQL 8 + Prisma 6 |
| Cache/Queue | Redis + BullMQ |
| Auth | JWT (HS256), access + refresh tokens |

### Database Schema

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  credits       Int      @default(3)  // 3 free on signup
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  jobs          Job[]
  transactions  CreditTransaction[]
}

model Job {
  id          String    @id @default(uuid())
  userId      String?   // null for anonymous jobs
  status      JobStatus @default(PENDING)
  originalUrl String    // R2/S3 URL
  results     Json?     // array of 4 result URLs
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User?     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}

enum JobStatus {
  PENDING
  PROCESSING
  DONE
  FAILED
}

model CreditTransaction {
  id        String   @id @default(uuid())
  userId    String
  delta     Int      // +3 (signup), -1 (download)
  reason    String   // 'signup_bonus' | 'download'
  jobId     String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### Backend Modules (Fastify)

```
src/modules/
├── auth/           # register, login, logout, refresh, me
├── upload/         # POST /upload — receives file, stores to R2, creates Job
├── jobs/           # GET /jobs/:id (status + results), GET /jobs (user history)
├── credits/        # GET /credits (balance), POST /credits/use (consume 1 credit)
└── ai/             # internal worker — calls fal.ai, updates job
```

### Frontend Pages & Features

```
app/
├── page.tsx                    # Homepage — hero + upload zone + results + pricing
├── (auth)/login/page.tsx       # Already exists
├── (auth)/register/page.tsx    # Already exists
└── dashboard/
    ├── page.tsx                # History of jobs + credit balance
    └── credits/page.tsx        # Credit packages (no payment yet — "Coming soon")

features/
├── upload/                     # Drag & drop zone, file validation
├── jobs/                       # Job status polling, results grid
├── credits/                    # Credit balance display, purchase page
└── auth/                       # Already exists
```

---

## 5. Visual Design

### Color Palette — "Luxury Beauty"

```css
/* Brand */
--brand-primary: 340 70% 55%;    /* Dusty rose — primary accent */
--brand-secondary: 280 30% 45%;  /* Muted plum */
--brand-accent: 35 80% 65%;      /* Warm gold — CTA buttons */

/* Surfaces */
--background: 30 15% 97%;        /* Warm cream (not pure white) */
--foreground: 340 15% 15%;       /* Dark plum (not black) */
--card: 0 0% 100%;
--muted: 340 20% 95%;            /* Light rose tint */
--border: 340 20% 88%;           /* Rose-tinted border */
```

Dark mode: deep eggplant/anthracite with gold accents.

### Icons (Lucide React — already in project)

| Action | Icon |
|---|---|
| Upload photo | `Upload`, `ImagePlus` |
| AI processing | `Sparkles`, `Wand2` |
| Download | `Download` |
| Credits | `Gem`, `Coins` |
| History | `History`, `Clock` |
| Beauty/eye | `Star`, `Eye` |
| Success | `CheckCircle2` |
| Style settings | `Sliders`, `Palette` |

### Component Patterns

- **Upload zone:** Dashed border, `Sparkles` icon centered, hover lifts with `shadow-md`
- **Results grid:** 2×2 layout, `rounded-xl`, blur overlay on unauthenticated
- **CTA button:** Gold accent (`bg-accent text-accent-foreground`), `Wand2` icon prefix
- **Loading state:** Skeleton cards matching result grid shape

---

## 6. AI Integration

**Provider:** fal.ai
**Model:** FLUX.1 [dev] img2img (or FLUX Schnell for speed)
**Output:** 4 variants per job

**Beauty prompt template:**
```
professional beauty photography, perfect studio lighting,
clean white/neutral background, sharp focus on lash/nail work,
high resolution, commercial quality, Instagram-ready,
soft bokeh background, warm professional lighting
```

**Parameters:**
- `strength: 0.4–0.6` (preserves original, improves quality)
- `num_images: 4`
- `image_size: "portrait_4_3"` or `"square_hd"`

---

## 7. MVP Exclusions (post-MVP)

- Stripe / real payments
- Email verification
- WebSocket (use polling for now)
- Style selection (auto/light/dark/warm)
- Social sharing
- Affiliate program

---

## 8. Verification Plan

1. Run backend: `npm run dev` → server starts on port 3000
2. Run frontend: `npm run dev` → opens on port 3001
3. Upload a photo on homepage → job created in DB
4. Job status polling → transitions PENDING → PROCESSING → DONE
5. Results appear in 2×2 grid (blurred if not logged in)
6. Register → 3 credits appear in dashboard
7. Download → credit consumed, file downloaded
8. Dashboard shows job history
