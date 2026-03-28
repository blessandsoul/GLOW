# Merge Lashes & Brows Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the `lashes` and `brows` categories into a single `lashes-brows` category everywhere in the system, and fix the landing page to use `serviceCategories` instead of `specialities`.

**Architecture:** The canonical category data lives in two DB tables (`specialities` and `service_categories`). Both must be updated via a Prisma migration + seed update. All client-side slug references (`lashes`, `brows`) must be replaced with `lashes-brows`, including icon maps, i18n dictionaries, and filter data.

**Tech Stack:** Prisma (MySQL), Next.js App Router, TypeScript, Tailwind CSS

---

## Files Modified

| File | Change |
|------|--------|
| `server/prisma/seed.ts` | Merge lashes+brows in both `specialities` and `serviceCategories` arrays |
| `server/prisma/migrations/<new>/migration.sql` | Data migration: rename slugs, update sortOrders |
| `client/src/features/landing/components/EditorialCategories.tsx` | Switch `useSpecialities` → `useServiceCategories`, update icon map + static fallback |
| `client/src/features/landing/components/ServiceCategories.tsx` | Switch `useSpecialities` → `useServiceCategories`, merge icon/color maps |
| `client/src/features/masters/components/FeaturedMasters.tsx` | Merge `lashes`+`brows` entries into `lashes-brows` |
| `client/src/features/masters/components/MastersCatalog.tsx` | Same |
| `client/src/i18n/dictionaries/ka.json` | Add `niche_lashes-brows` / `niche_lashes-brows_desc`, remove old keys |
| `client/src/i18n/dictionaries/ru.json` | Same (Russian) |
| `client/src/i18n/dictionaries/en.json` | Same (English) |

---

## Task 1: Prisma data migration — merge slugs in DB

**Files:**
- Create: `server/prisma/migrations/20260329120000_merge_lashes_brows/migration.sql`

- [ ] **Step 1: Create migration directory and SQL file**

```bash
mkdir -p server/prisma/migrations/20260329120000_merge_lashes_brows
```

Create `server/prisma/migrations/20260329120000_merge_lashes_brows/migration.sql`:

```sql
-- Step 1: Insert the merged lashes-brows speciality (sortOrder 0)
INSERT IGNORE INTO `specialities` (`slug`, `label`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES ('lashes-brows', 'წამწამები & წარბები', 0, 1, NOW(), NOW());

-- Step 2: Migrate masters whose niche is 'lashes' or 'brows' to 'lashes-brows'
-- (master_niches junction table — update if it exists)
UPDATE `master_niches` SET `speciality_slug` = 'lashes-brows'
WHERE `speciality_slug` IN ('lashes', 'brows');

-- Step 3: Delete old separate entries
DELETE FROM `specialities` WHERE `slug` IN ('lashes', 'brows');

-- Step 4: Shift sort orders for remaining specialities
UPDATE `specialities` SET `sort_order` = `sort_order` - 1
WHERE `sort_order` > 1 AND `slug` != 'lashes-brows';

-- Step 5: Insert the merged lashes-brows service_category
INSERT IGNORE INTO `service_categories` (`slug`, `label`, `icon`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES ('lashes-brows', 'წამწამები & წარბები', '✦', 0, 1, NOW(), NOW());

-- Step 6: Migrate service suggestions from lashes/brows to lashes-brows
UPDATE `service_suggestions` SET `category_slug` = 'lashes-brows'
WHERE `category_slug` IN ('lashes', 'brows');

-- Step 7: Delete old lashes/brows service_categories
DELETE FROM `service_categories` WHERE `slug` IN ('lashes', 'brows');

-- Step 8: Shift sort_order for service_categories too
UPDATE `service_categories` SET `sort_order` = `sort_order` - 1
WHERE `sort_order` > 1 AND `slug` != 'lashes-brows';
```

- [ ] **Step 2: Check the actual table & column names in schema**

Run:
```bash
cd server && grep -A5 "model Speciality\|model ServiceCategory\|model ServiceSuggestion\|@@map\|speciality_slug\|category_slug\|sort_order\|sortOrder" prisma/schema.prisma | head -60
```

Adjust the SQL above if column names differ (e.g., `sortOrder` vs `sort_order`). The `@@map` directive in Prisma schema tells you the real table name.

- [ ] **Step 3: Apply migration**

```bash
cd server && npx prisma migrate dev --name merge_lashes_brows
```

Expected: migration applied, no errors.

- [ ] **Step 4: Verify in Prisma Studio**

```bash
cd server && npx prisma studio
```

Check `specialities` table: should have `lashes-brows` and no `lashes`/`brows` rows.
Check `service_categories` table: same.

- [ ] **Step 5: Commit**

```bash
git add server/prisma/migrations/20260329120000_merge_lashes_brows/migration.sql
git commit -m "chore(db): migrate lashes+brows slugs to lashes-brows"
```

---

## Task 2: Update seed.ts

**Files:**
- Modify: `server/prisma/seed.ts`

- [ ] **Step 1: Update specialities array**

In `server/prisma/seed.ts`, replace the `specialities` array (around line 161):

```typescript
const specialities = [
  { slug: 'lashes-brows', label: 'წამწამები & წარბები', sortOrder: 0 },
  { slug: 'nails',         label: 'ფრჩხილები',           sortOrder: 1 },
  { slug: 'permanent-makeup', label: 'პერმანენტული მაკიაჟი', sortOrder: 2 },
  { slug: 'makeup',        label: 'მაკიაჟი',             sortOrder: 3 },
  { slug: 'hair',          label: 'თმა',                 sortOrder: 4 },
  { slug: 'skincare',      label: 'კანის მოვლა',         sortOrder: 5 },
  { slug: 'waxing',        label: 'ეპილაცია და რუჯი',    sortOrder: 6 },
  { slug: 'massage',       label: 'მასაჟი და სხეული',    sortOrder: 7 },
  { slug: 'lifestyle',     label: 'ცხოვრების სტილი და სხვა', sortOrder: 8 },
];
```

- [ ] **Step 2: Update serviceCategories array — replace lashes+brows with merged entry**

Replace the `lashes` block (sortOrder 0) and `brows` block (sortOrder 1) with:

```typescript
{
  slug: 'lashes-brows',
  label: 'წამწამები & წარბები',
  icon: '✦',
  sortOrder: 0,
  suggestions: [
    // წამწამები
    'წამწამების დაგრძელება (კლასიკური)',
    'წამწამების მოცულობითი დაგრძელება (2D, 3D, Volume)',
    'წამწამების კორექცია',
    'წამწამების მოხსნა',
    'წამწამების ლამინირება',
    'წამწამების ბიოდახვევა (Lash Lift)',
    'წამწამების შეღებვა',
    // წარბები
    'წარბების არქიტექტურა და ფორმირება',
    'წარბების ლამინირება',
    'წარბების შეღებვა (საღებავით / ხნით)',
    'წარბების კორექცია ძაფით',
    'წარბების კორექცია ცვილით',
    'წარბების კორექცია პინცეტით',
  ],
},
```

Then update all subsequent `sortOrder` values: `nails` → 1, `permanent-makeup` → 2, etc.

- [ ] **Step 3: Run seed to verify**

```bash
cd server && npx prisma db seed
```

Expected: no errors, `lashes-brows` present in both tables.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "chore(seed): merge lashes+brows into lashes-brows category"
```

---

## Task 3: Fix landing page — EditorialCategories.tsx

**Files:**
- Modify: `client/src/features/landing/components/editorial/EditorialCategories.tsx`

- [ ] **Step 1: Switch hook and update maps**

Replace the entire top section (imports + constants):

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Eye,
  Hand,
  Sparkles,
  Paintbrush,
  Scissors,
  Droplets,
  Wand2,
  Waves,
} from 'lucide-react';
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';

// TODO: replace with real photos
const CATEGORY_IMAGES: Record<string, string> = {};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'lashes-brows': Eye,
  nails: Hand,
  'permanent-makeup': Wand2,
  makeup: Paintbrush,
  hair: Scissors,
  skincare: Droplets,
  waxing: Waves,
  massage: Sparkles,
  lifestyle: Sparkles,
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80';
const DEFAULT_ICON = Sparkles;

const STATIC_CATEGORIES = [
  { slug: 'lashes-brows',     label: 'წამწამები & წარბები' },
  { slug: 'nails',            label: 'ფრჩხილები' },
  { slug: 'permanent-makeup', label: 'პერმანენტული მაკიაჟი' },
  { slug: 'makeup',           label: 'მაკიაჟი' },
  { slug: 'hair',             label: 'თმა' },
  { slug: 'skincare',         label: 'კანის მოვლა' },
  { slug: 'waxing',           label: 'ეპილაცია და რუჯი' },
  { slug: 'massage',          label: 'მასაჟი და სხეული' },
];
```

- [ ] **Step 2: Update component body — use serviceCategories**

Replace line:
```tsx
const { specialities: apiSpecialities, isLoading } = useSpecialities();
const specialities = apiSpecialities.length > 0 ? apiSpecialities : (!isLoading ? STATIC_CATEGORIES : []);
```

With:
```tsx
const { serviceCategories: apiCategories, isLoading } = useServiceCategories();
const specialities = apiCategories.length > 0 ? apiCategories : (!isLoading ? STATIC_CATEGORIES : []);
```

- [ ] **Step 3: Update the Link href** (slug changed)

The existing `href={`/masters?niche=${spec.slug}`}` is fine — no change needed, the slug `lashes-brows` will be passed correctly.

- [ ] **Step 4: Commit**

```bash
git add client/src/features/landing/components/editorial/EditorialCategories.tsx
git commit -m "feat(landing): switch editorial categories to use serviceCategories, merge lashes-brows"
```

---

## Task 4: Fix ServiceCategories.tsx (non-editorial landing component)

**Files:**
- Modify: `client/src/features/landing/components/ServiceCategories.tsx`

- [ ] **Step 1: Switch hook and update icon/color maps**

Replace the top section:

```tsx
import { useServiceCategories } from '@/features/profile/hooks/useCatalog';
```

Replace `NICHE_ICONS` and `NICHE_COLORS`:

```tsx
const NICHE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  'lashes-brows':     Eye,
  nails:              HandSoap,
  'permanent-makeup': Sparkle,
  makeup:             Sparkle,
  hair:               Scissors,
  skincare:           FlowerLotus,
};

const NICHE_COLORS: Record<string, string> = {
  'lashes-brows':     'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  nails:              'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  'permanent-makeup': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  makeup:             'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  hair:               'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  skincare:           'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};
```

- [ ] **Step 2: Replace hook usage**

Replace:
```tsx
const { specialities, isLoading } = useSpecialities();
```
With:
```tsx
const { serviceCategories: specialities, isLoading } = useServiceCategories();
```

- [ ] **Step 3: Commit**

```bash
git add client/src/features/landing/components/ServiceCategories.tsx
git commit -m "feat(landing): switch ServiceCategories to useServiceCategories, merge lashes-brows"
```

---

## Task 5: Fix FeaturedMasters.tsx and MastersCatalog.tsx

**Files:**
- Modify: `client/src/features/masters/components/FeaturedMasters.tsx`
- Modify: `client/src/features/masters/components/MastersCatalog.tsx`

- [ ] **Step 1: Update FeaturedMasters.tsx icon map**

Find (around line 26):
```tsx
lashes:   { icon: Eye },
// ...
brows:    { icon: Eye },
```

Replace both with:
```tsx
'lashes-brows': { icon: Eye },
```

- [ ] **Step 2: Update MastersCatalog.tsx icon map**

Same change — find `lashes` and `brows` keys in the icon/niche map and replace with:
```tsx
'lashes-brows': { icon: Eye },
```

- [ ] **Step 3: Commit**

```bash
git add client/src/features/masters/components/FeaturedMasters.tsx \
        client/src/features/masters/components/MastersCatalog.tsx
git commit -m "feat(masters): update niche icon maps to use lashes-brows slug"
```

---

## Task 6: Update i18n dictionaries

**Files:**
- Modify: `client/src/i18n/dictionaries/ka.json`
- Modify: `client/src/i18n/dictionaries/ru.json`
- Modify: `client/src/i18n/dictionaries/en.json`

- [ ] **Step 1: Update ka.json**

Find and replace:
```json
"niche_lashes": "წამწამები",
"niche_lashes_desc": "დაგრძელება, ლამინირება",
```
and
```json
"niche_brows": "წარბები",
"niche_brows_desc": "გაფორმება, შეღებვა",
```

Replace both pairs with:
```json
"niche_lashes-brows": "წამწამები & წარბები",
"niche_lashes-brows_desc": "დაგრძელება, ლამინირება, გაფორმება",
```

- [ ] **Step 2: Update ru.json**

Replace:
```json
"niche_lashes": "Ресницы",
"niche_lashes_desc": "Наращивание, ламинирование",
```
and
```json
"niche_brows": "Брови",
"niche_brows_desc": "Оформление, окрашивание",
```

With:
```json
"niche_lashes-brows": "Ресницы & Брови",
"niche_lashes-brows_desc": "Наращивание, ламинирование, оформление",
```

- [ ] **Step 3: Update en.json**

Replace:
```json
"niche_lashes": "Lashes",
"niche_lashes_desc": "Extensions, lamination",
```
and
```json
"niche_brows": "Brows",
"niche_brows_desc": "Shaping, tinting",
```

With:
```json
"niche_lashes-brows": "Lashes & Brows",
"niche_lashes-brows_desc": "Extensions, lamination, shaping",
```

- [ ] **Step 4: Commit**

```bash
git add client/src/i18n/dictionaries/ka.json \
        client/src/i18n/dictionaries/ru.json \
        client/src/i18n/dictionaries/en.json
git commit -m "feat(i18n): merge niche_lashes+niche_brows into niche_lashes-brows"
```

---

## Task 7: Check useCatalog hook — ensure useServiceCategories is exported

**Files:**
- Read: `client/src/features/profile/hooks/useCatalog.ts`

- [ ] **Step 1: Verify export exists**

```bash
grep "useServiceCategories\|serviceCategories" client/src/features/profile/hooks/useCatalog.ts
```

Expected: function `useServiceCategories` is exported returning `{ serviceCategories, isLoading }`.

- [ ] **Step 2: If not exported — add it**

If missing, add to the hook file:
```typescript
export function useServiceCategories(): { serviceCategories: ServiceCategory[]; isLoading: boolean } {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService.getServiceCategories().then((data) => {
      setServiceCategories(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return { serviceCategories, isLoading };
}
```

- [ ] **Step 3: Commit if changed**

```bash
git add client/src/features/profile/hooks/useCatalog.ts
git commit -m "feat(catalog): ensure useServiceCategories hook is exported"
```

---

## Task 8: Smoke test

- [ ] **Step 1: Build client**

```bash
cd client && npm run build
```

Expected: no TypeScript errors, no missing imports.

- [ ] **Step 2: Start dev server and verify**

```bash
cd client && npm run dev
```

Open `http://localhost:3000` — confirm:
- Landing page categories section shows `წამწამები & წარბები` as one card (not two separate)
- No `lashes` or `brows` cards remain
- All other categories display normally

- [ ] **Step 3: Check masters catalog**

Open `http://localhost:3000/masters` — confirm filter shows `lashes-brows` not two separate entries.

- [ ] **Step 4: Check service add panel**

As a master, open profile → add service → confirm categories list shows `წამწამები & წარბები` merged.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: merge lashes+brows cleanup — smoke test passed"
```
