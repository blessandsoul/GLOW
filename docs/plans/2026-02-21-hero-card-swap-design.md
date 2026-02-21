# Hero Card Swap — Design Doc
**Date:** 2026-02-21
**Feature:** Interactive 3D card swap on homepage hero section (desktop)

---

## Problem

On desktop, the hero section shows two cards:
- **Main card** (foreground, right): contains ImageCompare before/after slider, `z-20`, `rotate-3`
- **Secondary card** (background, left): decorative gradient only, `z-10`, `-rotate-6`, `pointer-events-none`

The secondary card is visible but not interactive. Users should be able to click it to bring it forward.

---

## Solution

Extract the two cards into a new `'use client'` component `HeroCards`. Use Framer Motion `animate` prop with spring physics to swap card positions, z-index, rotation, and scale on click.

---

## Component: `HeroCards`

**Location:** `src/features/landing/components/HeroCards.tsx`

**State:** `useState<'main' | 'secondary'>('main')` — which card is currently in front.

### Card A (initially main/foreground)
- Position: `right-0 top-1/2 -translate-y-1/2`
- Size: `380×520px`
- Content: ImageCompare slider (same as current)
- Overlay UI: "Luxury Retouch" info bar at bottom

### Card B (initially secondary/background)
- Position: `left-4 top-16`
- Size: `300×400px`
- Content: ImageCompare slider (same images, same component)
- Initially: decorative, lower opacity

### Animations (Framer Motion)

Each card uses `animate` prop — not CSS transitions — for spring-based movement:

```
Spring config: { stiffness: 80, damping: 20, mass: 1 }
```

**State A (default):**
| Card | x | rotate | scale | zIndex | opacity |
|------|---|--------|-------|--------|---------|
| Main (A) | 0 | 3 | 1 | 20 | 1 |
| Secondary (B) | 0 | -6 | 0.88 | 10 | 0.75 |

**State B (after click):**
| Card | rotate | scale | zIndex | opacity |
|------|--------|-------|--------|---------|
| Card A (now back) | -6 | 0.88 | 10 | 0.75 |
| Card B (now front) | 3 | 1 | 20 | 1 |

Cards animate their absolute positions by swapping their `top`/`left`/`right` via `animate` props.

### Interactivity

- Background card: `cursor-pointer` + `whileHover={{ scale: 1.02 }}` hint
- After swap: front card is NOT clickable (only the background card triggers swap)
- Actually: clicking background card ALWAYS swaps — so both states swap back and forth

### Hint Overlay

Small indicator on the background card (shown only once until clicked):
- Icon: `ArrowsClockwise` or similar
- Text: short hint (e.g., "click to switch")
- Hidden after first click via `useState(true)` → `false`
- No localStorage needed (resets on page refresh, which is fine)

---

## File Changes

1. **NEW** `src/features/landing/components/HeroCards.tsx` — the swappable card pair
2. **EDIT** `src/app/page.tsx` — replace the two inline card divs with `<HeroCards />`

---

## Constraints

- Desktop only (the outer grid already hides this section on mobile via `hidden md:grid`)
- No changes to mobile hero variants (HeroEditorial, HeroCentered, etc.)
- ImageCompare component is reused as-is, no changes
- Keep existing Framer Motion container animation on the wrapper div
