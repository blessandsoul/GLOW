# Pre-Generate Decoration Suggestions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pre-generate AI decoration suggestions in batches per niche and serve them instantly from the database, with live Gemini fallback when the pool is empty.

**Architecture:** New `decoration_suggestion` table stores pre-generated suggestions per niche. A BullMQ repeatable job runs every 12 hours to batch-generate ~50 suggestions per niche via Gemini. The existing `/decorations/suggest` endpoint reads 6 random suggestions from the DB pool instead of calling Gemini live. If the pool for a niche has fewer than 6 suggestions, it falls back to live Gemini generation (current behavior).

**Tech Stack:** Prisma (MySQL), BullMQ (Redis), Gemini API, Fastify

---

## Task 1: Add `decoration_suggestion` Prisma model

**Files:**
- Modify: `server/prisma/schema.prisma`

**Step 1: Add the model to schema.prisma**

Add this model at the end of the schema file:

```prisma
model DecorationSuggestion {
  id        String   @id @default(uuid())
  niche     String   @db.VarChar(20)
  labelEn   String   @map("label_en") @db.VarChar(80)
  labelRu   String   @map("label_ru") @db.VarChar(80)
  labelKa   String   @map("label_ka") @db.VarChar(80)
  promptValue String @map("prompt_value") @db.VarChar(150)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([niche])
  @@map("decoration_suggestions")
}
```

**Step 2: Run migration**

```bash
cd server
npm run prisma:migrate dev -- --name add_decoration_suggestions
```

Expected: Migration created and applied successfully.

**Step 3: Verify with Prisma Studio**

```bash
npm run prisma:studio
```

Expected: `decoration_suggestions` table visible, empty.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add decoration_suggestions table for pre-generated AI ideas"
```

---

## Task 2: Create decoration suggestions repository

**Files:**
- Create: `server/src/modules/decorations/decorations.repo.ts`

**Step 1: Create the repository file**

```typescript
import { prisma } from '../../libs/prisma.js';

const VALID_NICHES = ['hair', 'eyes', 'lips', 'nails', 'skin', 'general'] as const;

export const decorationsRepo = {
  async getRandomByNiche(niche: string, count: number): Promise<{
    id: string;
    niche: string;
    labelEn: string;
    labelRu: string;
    labelKa: string;
    promptValue: string;
  }[]> {
    // MySQL RAND() for random selection
    return prisma.$queryRaw`
      SELECT id, niche, label_en AS "labelEn", label_ru AS "labelRu", label_ka AS "labelKa", prompt_value AS "promptValue"
      FROM decoration_suggestions
      WHERE niche = ${niche}
      ORDER BY RAND()
      LIMIT ${count}
    `;
  },

  async countByNiche(niche: string): Promise<number> {
    return prisma.decorationSuggestion.count({ where: { niche } });
  },

  async insertMany(suggestions: {
    niche: string;
    labelEn: string;
    labelRu: string;
    labelKa: string;
    promptValue: string;
  }[]): Promise<number> {
    const result = await prisma.decorationSuggestion.createMany({
      data: suggestions,
      skipDuplicates: true,
    });
    return result.count;
  },

  async deleteOldestByNiche(niche: string, keepCount: number): Promise<number> {
    // Find IDs to keep (most recent `keepCount`)
    const toKeep = await prisma.decorationSuggestion.findMany({
      where: { niche },
      orderBy: { createdAt: 'desc' },
      take: keepCount,
      select: { id: true },
    });

    const keepIds = toKeep.map(r => r.id);

    if (keepIds.length === 0) return 0;

    const deleted = await prisma.decorationSuggestion.deleteMany({
      where: {
        niche,
        id: { notIn: keepIds },
      },
    });

    return deleted.count;
  },

  async getNicheCounts(): Promise<{ niche: string; count: number }[]> {
    const counts = await Promise.all(
      VALID_NICHES.map(async (niche) => ({
        niche,
        count: await prisma.decorationSuggestion.count({ where: { niche } }),
      }))
    );
    return counts;
  },
};
```

**Step 2: Commit**

```bash
git add src/modules/decorations/decorations.repo.ts
git commit -m "feat: add decorations repository for pre-generated suggestions"
```

---

## Task 3: Add batch generation logic to the service

**Files:**
- Modify: `server/src/modules/decorations/decorations.service.ts`

**Step 1: Add batch generation method and update suggestDecorations**

Keep the existing `suggestDecorations` method (it becomes the live fallback). Add two new methods:

1. `generateBatch(niche, count)` - calls Gemini to generate `count` suggestions and stores them in DB
2. `getSuggestions(niche)` - tries DB pool first, falls back to live Gemini

Update the service to import the repo and add these methods:

```typescript
import { env } from '@/config/env.js';
import { logger } from '../../libs/logger.js';
import { InternalError } from '../../shared/errors/errors.js';
import { decorationsRepo } from './decorations.repo.js';

interface GeneratedDecoration {
  label_en: string;
  label_ru: string;
  label_ka: string;
  promptValue: string;
}

const NICHE_CONTEXT: Record<string, string> = {
  hair: 'hairstyles, hair extensions, braids, updos',
  eyes: 'eye makeup, eyelash extensions, eyebrows',
  lips: 'lip makeup, lip art, lip gloss',
  nails: 'nail art, manicure, nail design',
  skin: 'skincare, facial treatments, skin glow',
  general: 'beauty photography, portrait photography',
};

const VALID_NICHES = Object.keys(NICHE_CONTEXT);
const POOL_TARGET = 50;       // target suggestions per niche
const POOL_MAX = 80;          // trim if exceeds this
const BATCH_SIZE = 10;        // suggestions per Gemini call
const SERVE_COUNT = 6;        // suggestions returned to user
const MIN_POOL_THRESHOLD = 6; // below this, fall back to live

export const decorationsService = {
  /**
   * Serve suggestions: DB pool first, live Gemini fallback.
   */
  async getSuggestions(niche: string): Promise<GeneratedDecoration[]> {
    const poolCount = await decorationsRepo.countByNiche(niche);

    if (poolCount >= MIN_POOL_THRESHOLD) {
      const rows = await decorationsRepo.getRandomByNiche(niche, SERVE_COUNT);
      return rows.map(r => ({
        label_en: r.labelEn,
        label_ru: r.labelRu,
        label_ka: r.labelKa,
        promptValue: r.promptValue,
      }));
    }

    logger.warn({ niche, poolCount }, 'Decoration pool low, falling back to live Gemini');
    return this.suggestDecorationsLive(niche);
  },

  /**
   * Live Gemini generation (original behavior, now used as fallback only).
   */
  async suggestDecorationsLive(niche: string): Promise<GeneratedDecoration[]> {
    const { getGeminiClient } = await import('../../libs/gemini.js');
    const gemini = getGeminiClient();

    const context = NICHE_CONTEXT[niche] ?? NICHE_CONTEXT.general;

    const prompt = `You are a creative beauty photo decoration expert. Generate 6 unique, creative decorative element ideas for beauty photos in the "${niche}" category (${context}).

These decorations will be digitally added to beauty photos. Think of beautiful, photogenic objects like flowers, crystals, light effects, nature elements, luxury items, etc.

Requirements:
- Each idea should be visually stunning and work well in beauty photography
- Avoid generic/common ideas like "roses" or "butterflies" — be creative and specific
- Ideas should be tasteful and elegant, matching luxury beauty aesthetics
- Each promptValue should be a concise English phrase (3-8 words) describing the decoration for an AI image generator

Return ONLY a JSON array, no other text:
[{"label_en":"English name","label_ru":"Russian name","label_ka":"Georgian name","promptValue":"concise english prompt phrase"}]`;

    try {
      logger.info({ niche }, 'Generating decoration suggestions via Gemini (live fallback)');

      const response = await gemini.models.generateContent({
        model: env.GEMINI_TEXT_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseModalities: ['Text'] },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new InternalError('Gemini returned no candidates');
      }

      const textPart = candidates[0].content?.parts?.find((p: { text?: string }) => p.text);
      if (!textPart?.text) {
        throw new InternalError('Gemini returned no text');
      }

      let jsonStr = textPart.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr) as GeneratedDecoration[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new InternalError('Invalid decoration suggestions format');
      }

      const valid = parsed
        .filter(d => d.label_en && d.promptValue)
        .slice(0, 6)
        .map(d => ({
          label_en: String(d.label_en).slice(0, 50),
          label_ru: String(d.label_ru || d.label_en).slice(0, 50),
          label_ka: String(d.label_ka || d.label_en).slice(0, 50),
          promptValue: String(d.promptValue).slice(0, 100),
        }));

      logger.info({ niche, count: valid.length }, 'Decoration suggestions generated (live)');
      return valid;
    } catch (err: unknown) {
      if (err instanceof InternalError) throw err;

      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        logger.warn({ err }, 'Gemini rate limit during decoration suggestions');
        throw new InternalError('Suggestion generation temporarily unavailable');
      }

      logger.error({ err }, 'Decoration suggestion generation error');
      throw new InternalError('Failed to generate decoration suggestions');
    }
  },

  /**
   * Batch-generate suggestions for a single niche and store in DB.
   * Called by the cron worker. Generates `count` suggestions in batches of BATCH_SIZE.
   */
  async generateBatch(niche: string, count: number = POOL_TARGET): Promise<number> {
    const { getGeminiClient } = await import('../../libs/gemini.js');
    const gemini = getGeminiClient();
    const context = NICHE_CONTEXT[niche] ?? NICHE_CONTEXT.general;

    let totalInserted = 0;
    const iterations = Math.ceil(count / BATCH_SIZE);

    for (let i = 0; i < iterations; i++) {
      const batchCount = Math.min(BATCH_SIZE, count - totalInserted);

      const prompt = `You are a creative beauty photo decoration expert. Generate ${batchCount} unique, creative decorative element ideas for beauty photos in the "${niche}" category (${context}).

These decorations will be digitally added to beauty photos. Think of beautiful, photogenic objects like flowers, crystals, light effects, nature elements, luxury items, etc.

Requirements:
- Each idea should be visually stunning and work well in beauty photography
- Avoid generic/common ideas like "roses" or "butterflies" — be creative and specific
- Ideas should be tasteful and elegant, matching luxury beauty aesthetics
- Each promptValue should be a concise English phrase (3-8 words) describing the decoration for an AI image generator
- Make every idea DIFFERENT from common suggestions — be wildly creative

Return ONLY a JSON array, no other text:
[{"label_en":"English name","label_ru":"Russian name","label_ka":"Georgian name","promptValue":"concise english prompt phrase"}]`;

      try {
        const response = await gemini.models.generateContent({
          model: env.GEMINI_TEXT_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseModalities: ['Text'] },
        });

        const candidates = response.candidates;
        if (!candidates?.[0]?.content?.parts) continue;

        const textPart = candidates[0].content.parts.find((p: { text?: string }) => p.text);
        if (!textPart?.text) continue;

        let jsonStr = textPart.text.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr) as GeneratedDecoration[];
        if (!Array.isArray(parsed)) continue;

        const valid = parsed
          .filter(d => d.label_en && d.promptValue)
          .slice(0, batchCount)
          .map(d => ({
            niche,
            labelEn: String(d.label_en).slice(0, 80),
            labelRu: String(d.label_ru || d.label_en).slice(0, 80),
            labelKa: String(d.label_ka || d.label_en).slice(0, 80),
            promptValue: String(d.promptValue).slice(0, 150),
          }));

        const inserted = await decorationsRepo.insertMany(valid);
        totalInserted += inserted;

        logger.info({ niche, batch: i + 1, inserted, totalInserted }, 'Decoration batch inserted');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          logger.warn({ niche, batch: i + 1 }, 'Gemini rate limit during batch generation, stopping');
          break;
        }
        logger.error({ err, niche, batch: i + 1 }, 'Decoration batch generation error');
        // Continue to next batch on non-rate-limit errors
      }
    }

    // Trim pool if it grew too large
    const currentCount = await decorationsRepo.countByNiche(niche);
    if (currentCount > POOL_MAX) {
      const deleted = await decorationsRepo.deleteOldestByNiche(niche, POOL_TARGET);
      logger.info({ niche, deleted, kept: POOL_TARGET }, 'Trimmed decoration pool');
    }

    return totalInserted;
  },

  /**
   * Replenish all niches. Called by cron worker.
   */
  async replenishAllNiches(): Promise<void> {
    logger.info('Starting decoration suggestion replenishment for all niches');

    for (const niche of VALID_NICHES) {
      const currentCount = await decorationsRepo.countByNiche(niche);
      const needed = POOL_TARGET - currentCount;

      if (needed <= 0) {
        logger.info({ niche, currentCount }, 'Pool already full, skipping');
        continue;
      }

      logger.info({ niche, currentCount, needed }, 'Replenishing decoration pool');
      const inserted = await this.generateBatch(niche, needed);
      logger.info({ niche, inserted }, 'Decoration pool replenished');

      // Small delay between niches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('Decoration suggestion replenishment complete');
  },
};
```

**Step 2: Commit**

```bash
git add src/modules/decorations/decorations.service.ts
git commit -m "feat: add batch generation and DB pool serving for decoration suggestions"
```

---

## Task 4: Update controller to use pool-based serving

**Files:**
- Modify: `server/src/modules/decorations/decorations.controller.ts`

**Step 1: Update the suggest method to call getSuggestions instead of suggestDecorations**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { SuggestDecorationsBodySchema } from './decorations.schemas.js';
import { decorationsService } from './decorations.service.js';
import { successResponse } from '../../shared/responses/successResponse.js';

export const decorationsController = {
  async suggest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { niche } = SuggestDecorationsBodySchema.parse(request.body);
    const suggestions = await decorationsService.getSuggestions(niche);
    await reply.send(successResponse('Decoration suggestions generated', suggestions));
  },
};
```

**Step 2: Commit**

```bash
git add src/modules/decorations/decorations.controller.ts
git commit -m "feat: serve decoration suggestions from pre-generated pool"
```

---

## Task 5: Create BullMQ decoration worker

**Files:**
- Create: `server/src/libs/decoration-worker.ts`

This follows the exact same pattern as `subscription-worker.ts`.

**Step 1: Create the worker file**

```typescript
import { Queue, Worker } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from './logger.js';
import { decorationsService } from '../modules/decorations/decorations.service.js';

const QUEUE_NAME = 'decoration-replenishment';
const connection = { url: env.REDIS_URL };

const decorationQueue = new Queue(QUEUE_NAME, { connection });
const decorationWorker = new Worker(
  QUEUE_NAME,
  async () => {
    logger.info('Decoration replenishment job started');
    await decorationsService.replenishAllNiches();
    logger.info('Decoration replenishment job completed');
  },
  {
    connection,
    concurrency: 1,
  },
);

decorationWorker.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id }, 'Decoration replenishment job failed');
});

decorationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Decoration replenishment job completed successfully');
});

export async function startDecorationReplenishmentSchedule(): Promise<void> {
  // Remove any existing repeatable jobs first
  const existing = await decorationQueue.getRepeatableJobs();
  for (const job of existing) {
    await decorationQueue.removeRepeatableByKey(job.key);
  }

  // Run every 12 hours
  await decorationQueue.add(
    'replenish',
    {},
    { repeat: { every: 12 * 60 * 60 * 1000 } },
  );

  // Also run once immediately on startup to seed the pool
  await decorationQueue.add('replenish-initial', {});

  logger.info('Decoration replenishment schedule started (every 12 hours)');
}

export { decorationWorker, decorationQueue };
```

**Step 2: Commit**

```bash
git add src/libs/decoration-worker.ts
git commit -m "feat: add BullMQ decoration replenishment worker (every 12h)"
```

---

## Task 6: Register the worker in server.ts

**Files:**
- Modify: `server/src/server.ts`

**Step 1: Import and initialize the decoration worker**

Find the existing imports for `emailWorker` and `subscriptionWorker` and add:

```typescript
import { decorationWorker, startDecorationReplenishmentSchedule } from './libs/decoration-worker.js';
```

Find where `startSubscriptionRenewalSchedule()` is called (in the primary instance block) and add after it:

```typescript
await startDecorationReplenishmentSchedule();
```

Find the `onClose` hook where workers are gracefully closed and add:

```typescript
await decorationWorker.close();
```

**Step 2: Commit**

```bash
git add src/server.ts
git commit -m "feat: register decoration replenishment worker on startup"
```

---

## Task 7: Add admin endpoint to manually trigger replenishment

**Files:**
- Modify: `server/src/modules/decorations/decorations.controller.ts`
- Modify: `server/src/modules/decorations/decorations.routes.ts`

**Step 1: Add admin controller method**

Add to `decorationsController`:

```typescript
async replenish(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const counts = await decorationsRepo.getNicheCounts();
  // Fire and forget — don't make admin wait for all Gemini calls
  decorationsService.replenishAllNiches().catch(err => {
    logger.error({ err }, 'Manual decoration replenishment failed');
  });
  await reply.send(successResponse('Decoration replenishment started', { currentCounts: counts }));
},

async poolStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const counts = await decorationsRepo.getNicheCounts();
  await reply.send(successResponse('Decoration pool status', { counts }));
},
```

Add necessary imports at top of controller:
```typescript
import { decorationsRepo } from './decorations.repo.js';
import { logger } from '../../libs/logger.js';
```

**Step 2: Add admin routes**

In `decorations.routes.ts`, add the admin routes (assuming there's an `authorize` or role-checking middleware — look at how admin routes work in the existing admin module):

```typescript
import { authenticate } from '../../libs/auth.js';
// Add admin authorization import based on existing pattern

// Existing route
app.post('/suggest', { preHandler: [authenticate] }, decorationsController.suggest);

// Admin routes
app.get('/pool-status', { preHandler: [authenticate] }, decorationsController.poolStatus);
app.post('/replenish', { preHandler: [authenticate] }, decorationsController.replenish);
```

Note: Check the existing admin module for the correct authorization middleware pattern and apply it to the admin routes. These should be admin-only.

**Step 3: Commit**

```bash
git add src/modules/decorations/
git commit -m "feat: add admin endpoints for decoration pool status and manual replenishment"
```

---

## Task 8: Update Postman collection

**Files:**
- Modify: `server/postman/collection.json`

**Step 1: Add new requests to the Decorations folder**

Add these requests:

1. **Pool Status** - `GET {{baseUrl}}/decorations/pool-status` (admin auth)
2. **Replenish** - `POST {{baseUrl}}/decorations/replenish` (admin auth)

The existing `Suggest` request should still work as before.

**Step 2: Commit**

```bash
git add postman/
git commit -m "docs: add decoration pool admin endpoints to Postman collection"
```

---

## Task 9: Test end-to-end

**Step 1: Start the server**

```bash
cd server
npm run dev
```

**Step 2: Check pool status (should be empty initially)**

```bash
curl http://localhost:8000/api/v1/decorations/pool-status -H "Authorization: Bearer <token>"
```

Expected: All niches show count: 0.

**Step 3: Trigger manual replenishment**

```bash
curl -X POST http://localhost:8000/api/v1/decorations/replenish -H "Authorization: Bearer <token>"
```

Expected: Returns immediately with current counts. Check server logs for batch generation progress.

**Step 4: Wait for replenishment, then test suggest endpoint**

```bash
curl -X POST http://localhost:8000/api/v1/decorations/suggest \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"niche":"hair"}'
```

Expected: Returns 6 suggestions instantly (from DB pool, no Gemini delay).

**Step 5: Verify each niche has its own pool**

```bash
curl http://localhost:8000/api/v1/decorations/pool-status -H "Authorization: Bearer <token>"
```

Expected: Each niche (hair, eyes, lips, nails, skin, general) has ~50 suggestions.

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete pre-generated decoration suggestions with cron replenishment"
```
