# Bottom Navigation Redesign — Role-Based Aggregator Menu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign MobileBottomNav from a master-only tool into a role-based aggregator navigation with shared base (Home, Search, Profile) and role-specific items (Favorites + Appointments for USER, Appointments + Portfolio for MASTER).

**Architecture:** The `MobileBottomNav` component destructures `user` from `useAuth()` and reads `user.role` to determine which 5 nav items to render. Three new stub pages are created (`/search`, `/favorites`, `/appointments`). The existing `/masters` page content is reused as the search page foundation. The `/masters` route remains active for backwards-compatibility; a redirect to `/search` can be added in a follow-up. Routes and i18n are extended accordingly.

**Note on `/create` route:** The Create FAB is removed from the bottom nav, but `ROUTES.CREATE` and the `/create` page remain in the codebase — they are still accessible via other navigation paths. Cleanup is out of scope for this plan.

**Tech Stack:** Next.js App Router, React, Redux (auth state), Phosphor Icons, Tailwind CSS, i18n dictionaries (ru/en/ka)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `client/src/lib/constants/routes.ts` | Add SEARCH, FAVORITES, APPOINTMENTS routes |
| Modify | `client/src/i18n/dictionaries/ru.json` | Add nav keys: search, favorites, appointments |
| Modify | `client/src/i18n/dictionaries/en.json` | Add nav keys: search, favorites, appointments |
| Modify | `client/src/i18n/dictionaries/ka.json` | Add nav keys: search, favorites, appointments |
| Create | `client/src/app/(main)/search/page.tsx` | Search/explore page (wraps MastersCatalog) |
| Create | `client/src/app/(main)/favorites/page.tsx` | Favorites stub page |
| Create | `client/src/app/(main)/appointments/page.tsx` | Appointments stub page |
| Modify | `client/src/components/layout/MobileBottomNav.tsx` | Role-based nav items, remove Create FAB |

---

### Task 1: Add New Routes

**Files:**
- Modify: `client/src/lib/constants/routes.ts`

- [ ] **Step 1: Add route constants**

```typescript
// Add after MASTERS line:
SEARCH: '/search',
FAVORITES: '/favorites',
APPOINTMENTS: '/appointments',
```

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/constants/routes.ts
git commit -m "feat: add search, favorites, appointments route constants"
```

---

### Task 2: Add i18n Keys

**Files:**
- Modify: `client/src/i18n/dictionaries/ru.json`
- Modify: `client/src/i18n/dictionaries/en.json`
- Modify: `client/src/i18n/dictionaries/ka.json`

- [ ] **Step 1: Add nav keys to all three dictionaries**

Merge these keys into the existing `"nav"` object in each dictionary. Do NOT remove existing keys (`dashboard`, `branding`, `create`, `portfolio`, etc.) — they may be used elsewhere.

Russian — add to `"nav"`:
```json
"home": "Главная",
"search": "Поиск",
"favorites": "Избранное",
"appointments": "Записи"
```

English — add to `"nav"`:
```json
"home": "Home",
"search": "Search",
"favorites": "Favorites",
"appointments": "Appointments"
```

Georgian — add to `"nav"`:
```json
"home": "მთავარი",
"search": "ძიება",
"favorites": "რჩეულები",
"appointments": "ჯავშნები"
```

- [ ] **Step 2: Commit**

```bash
git add client/src/i18n/dictionaries/
git commit -m "feat: add i18n keys for new bottom nav items"
```

---

### Task 3: Create Search Page

**Files:**
- Create: `client/src/app/(main)/search/page.tsx`

- [ ] **Step 1: Create search page reusing MastersCatalog**

```tsx
import { Suspense } from 'react';
import { MastersCatalog } from '@/features/masters/components/MastersCatalog';

export default function SearchPage(): React.ReactElement {
    return (
        <Suspense>
            <MastersCatalog />
        </Suspense>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/app/(main)/search/page.tsx
git commit -m "feat: add search page wrapping MastersCatalog"
```

---

### Task 4: Create Favorites Stub Page

**Files:**
- Create: `client/src/app/(main)/favorites/page.tsx`

- [ ] **Step 1: Create favorites stub with empty state**

```tsx
'use client';

import { Heart } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export default function FavoritesPage(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto flex min-h-[60dvh] flex-col items-center justify-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Heart size={32} className="text-primary" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
                {t('favorites.empty_title')}
            </h1>
            <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
                {t('favorites.empty_description')}
            </p>
        </div>
    );
}
```

- [ ] **Step 2: Add i18n keys for favorites empty state to all dictionaries**

Russian: `"favorites": { "empty_title": "Пока пусто", "empty_description": "Сохраняйте мастеров, чтобы быстро находить их снова" }`

English: `"favorites": { "empty_title": "No favorites yet", "empty_description": "Save masters to quickly find them again" }`

Georgian: `"favorites": { "empty_title": "ჯერ ცარიელია", "empty_description": "შეინახეთ ოსტატები, რომ სწრაფად იპოვოთ ისინი" }`

- [ ] **Step 3: Commit**

```bash
git add client/src/app/(main)/favorites/page.tsx client/src/i18n/dictionaries/
git commit -m "feat: add favorites stub page with empty state"
```

---

### Task 5: Create Appointments Stub Page

**Files:**
- Create: `client/src/app/(main)/appointments/page.tsx`

- [ ] **Step 1: Create appointments stub with empty state**

```tsx
'use client';

import { CalendarBlank } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export default function AppointmentsPage(): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto flex min-h-[60dvh] flex-col items-center justify-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <CalendarBlank size={32} className="text-primary" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
                {t('appointments.empty_title')}
            </h1>
            <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
                {t('appointments.empty_description')}
            </p>
        </div>
    );
}
```

- [ ] **Step 2: Add i18n keys for appointments empty state to all dictionaries**

Russian: `"appointments": { "empty_title": "Нет записей", "empty_description": "Здесь появятся ваши записи к мастерам" }`

English: `"appointments": { "empty_title": "No appointments", "empty_description": "Your appointments with masters will appear here" }`

Georgian: `"appointments": { "empty_title": "ჯავშნები არ არის", "empty_description": "აქ გამოჩნდება თქვენი ჯავშნები ოსტატებთან" }`

- [ ] **Step 3: Commit**

```bash
git add client/src/app/(main)/appointments/page.tsx client/src/i18n/dictionaries/
git commit -m "feat: add appointments stub page with empty state"
```

---

### Task 6: Redesign MobileBottomNav — Role-Based Items

**Files:**
- Modify: `client/src/components/layout/MobileBottomNav.tsx`

- [ ] **Step 1: Rewrite MobileBottomNav with role-based navigation**

Replace the entire component. Key changes:
- Remove the Create FAB (center raised button with shimmer)
- Import `House`, `MagnifyingGlass`, `Heart`, `CalendarBlank`, `Images`, `UserCircle` from Phosphor
- Destructure `user` from `useAuth()` and read `user?.role`
- Keep the existing auth guard: `if (isInitializing || !isAuthenticated) return null;`
- Build nav items dynamically:

```typescript
// Shared items (positions 1, 2, 5)
const SHARED_START: BottomNavItem[] = [
    { href: ROUTES.HOME, label: 'nav.home', icon: House, exact: true },
    { href: ROUTES.SEARCH, label: 'nav.search', icon: MagnifyingGlass },
];

const SHARED_END: BottomNavItem[] = [
    { href: ROUTES.DASHBOARD_PROFILE, label: 'nav.profile', icon: UserCircle },
];

// Role-specific items (positions 3, 4)
const USER_ITEMS: BottomNavItem[] = [
    { href: ROUTES.FAVORITES, label: 'nav.favorites', icon: Heart },
    { href: ROUTES.APPOINTMENTS, label: 'nav.appointments', icon: CalendarBlank },
];

const MASTER_ITEMS: BottomNavItem[] = [
    { href: ROUTES.APPOINTMENTS, label: 'nav.appointments', icon: CalendarBlank },
    { href: ROUTES.DASHBOARD_PORTFOLIO, label: 'nav.portfolio', icon: Images },
];
```

- In the component body:
```typescript
const { user, isAuthenticated, isInitializing } = useAuth();
const pathname = usePathname();
const { t } = useLanguage();

if (isInitializing || !isAuthenticated) return null;

const role = user?.role;
const items = [...SHARED_START, ...(role === 'MASTER' ? MASTER_ITEMS : USER_ITEMS), ...SHARED_END];
```
- Render all 5 items uniformly with `NavTab` (no more raised center button)
- Show nav for all authenticated users (USER, MASTER, SALON), hide for ADMIN
- SALON uses same items as USER for now

- [ ] **Step 2: Update the component render — flat 5-tab layout**

Remove the center Create FAB JSX. Replace with a simple map over all items:

```tsx
<nav
    className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150 md:hidden"
    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
>
    <div className="flex items-center">
        {items.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} t={t} />
        ))}
    </div>
</nav>
```

- [ ] **Step 3: Verify locally — check nav renders correctly for different roles**

Run: `cd client && npm run dev`
- Navigate as USER → should see: Home, Search, Favorites, Appointments, Profile
- Navigate as MASTER → should see: Home, Search, Appointments, Portfolio, Profile

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/MobileBottomNav.tsx
git commit -m "feat: redesign bottom nav with role-based items for aggregator model"
```

---

### Task 7: Clean Up Unused Create-Button Animations

**Files:**
- Modify: `client/src/app/globals.css` (if `animate-create-shine-rotate` and `animate-create-shimmer` are defined there)

- [ ] **Step 1: Search for and remove Create FAB animation keyframes**

Search `globals.css` or `tailwind` config for `create-shine-rotate` and `create-shimmer` keyframes. Remove them if no longer referenced anywhere.

- [ ] **Step 2: Commit**

```bash
git add client/src/app/globals.css
git commit -m "chore: remove unused create button animation keyframes"
```

---

## Summary

| # | Task | Files |
|---|------|-------|
| 1 | Add route constants | `routes.ts` |
| 2 | Add i18n nav keys | 3 dictionary files |
| 3 | Create Search page | `search/page.tsx` |
| 4 | Create Favorites stub | `favorites/page.tsx` + i18n |
| 5 | Create Appointments stub | `appointments/page.tsx` + i18n |
| 6 | Redesign MobileBottomNav | `MobileBottomNav.tsx` |
| 7 | Clean up unused animations | `globals.css` |

### Navigation Matrix

| Position | USER | MASTER |
|----------|------|--------|
| 1 | Home `/` | Home `/` |
| 2 | Search `/search` | Search `/search` |
| 3 | Favorites `/favorites` | Appointments `/appointments` |
| 4 | Appointments `/appointments` | Portfolio `/dashboard/portfolio` |
| 5 | Profile `/dashboard/profile` | Profile `/dashboard/profile` |
