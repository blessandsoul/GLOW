# Hero Card Swap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interactive 3D card swap to the homepage desktop hero — clicking the background card brings it forward with spring animation, the main card goes back.

**Architecture:** Extract the two hero cards from `page.tsx` into a new `HeroCards` client component. Use Framer Motion `animate` prop (not CSS transitions) with spring physics to animate position, rotation, scale, zIndex, and opacity when the user clicks the background card. Both cards render ImageCompare so the swapped card is fully interactive.

**Tech Stack:** React (useState), Framer Motion (motion/react — already installed), Phosphor Icons (already installed), Tailwind CSS, TypeScript strict

---

### Task 1: Create `HeroCards` component

**Files:**
- Create: `client/src/features/landing/components/HeroCards.tsx`

**Step 1: Create the file with the component skeleton**

```tsx
'use client';

import { useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { ImageCompare } from '@/components/ui/ImageCompare';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export function HeroCards(): React.ReactElement {
    const { t } = useLanguage();
    const [swapped, setSwapped] = useState(false);
    const [hintDismissed, setHintDismissed] = useState(false);

    const spring = { type: 'spring', stiffness: 80, damping: 20, mass: 1 } as const;

    // Card A = initially main (foreground right)
    // Card B = initially secondary (background left)
    // When swapped=true: B is foreground, A is background

    const cardAAnimate = swapped
        ? { rotate: -6, scale: 0.88, opacity: 0.75, zIndex: 10 }
        : { rotate: 3, scale: 1, opacity: 1, zIndex: 20 };

    const cardBAnimate = swapped
        ? { rotate: 3, scale: 1, opacity: 1, zIndex: 20 }
        : { rotate: -6, scale: 0.88, opacity: 0.75, zIndex: 10 };

    function handleSwap(): void {
        setSwapped((s) => !s);
        setHintDismissed(true);
    }

    return (
        <>
            {/* Card A — Main (ImageCompare) */}
            <motion.div
                animate={cardAAnimate}
                transition={spring}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-[380px] h-[520px] rounded-[2.5rem] bg-white p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-zinc-100/80 dark:bg-zinc-900 dark:border-zinc-800 ease-out"
                style={{ zIndex: swapped ? 10 : 20 }}
            >
                <div className="w-full h-full rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                    <ImageCompare
                        beforeSrc="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop"
                        afterSrc="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=800&fit=crop"
                        beforeAlt={t('visual.before')}
                        afterAlt={t('visual.after')}
                        initialPosition={40}
                        className="h-full w-full"
                    />
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-white/90 backdrop-blur-md p-4 shadow-xl dark:bg-zinc-900/90 border border-white/20 dark:border-zinc-700/50 z-30 pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Sparkle size={20} weight="fill" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-white">{t('visual.lux')}</div>
                                <div className="text-xs font-medium text-zinc-500">{t('visual.completed')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Card B — Secondary (clickable, ImageCompare) */}
            <motion.div
                animate={cardBAnimate}
                transition={spring}
                onClick={handleSwap}
                whileHover={!swapped ? { scale: 0.91 } : undefined}
                className="absolute left-4 top-16 w-[300px] h-[400px] rounded-[2.5rem] bg-white/80 backdrop-blur-xl p-3 shadow-2xl border border-white/50 dark:bg-zinc-900/80 dark:border-zinc-800/50 cursor-pointer"
                style={{ zIndex: swapped ? 20 : 10 }}
            >
                <div className="w-full h-full rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                    <ImageCompare
                        beforeSrc="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop"
                        afterSrc="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=800&fit=crop"
                        beforeAlt={t('visual.before')}
                        afterAlt={t('visual.after')}
                        initialPosition={60}
                        className="h-full w-full"
                    />

                    {/* Hint overlay — shown until first click */}
                    {!hintDismissed && (
                        <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-40">
                            <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-medium">
                                <span>↑</span>
                                <span>tap to switch</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
```

**Step 2: Verify TypeScript compiles (no errors expected yet — just check)**

```bash
cd client && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only if imports are wrong. Fix any import path issues.

**Step 3: Commit the new component**

```bash
git add client/src/features/landing/components/HeroCards.tsx
git commit -m "feat: add HeroCards component with 3D card swap animation"
```

---

### Task 2: Wire `HeroCards` into `page.tsx`

**Files:**
- Modify: `client/src/app/page.tsx` (lines ~222–262 — the Visual Composition block)

**Step 1: Add HeroCards import at top of page.tsx**

In the imports section (around line 15–16), add:
```tsx
import { HeroCards } from '@/features/landing/components/HeroCards';
```

**Step 2: Replace the two inline card divs with `<HeroCards />`**

Find this block in `page.tsx` (lines ~229–261):
```tsx
{/* Main Floating Card - Before/After Concept */}
<div className="absolute right-0 top-1/2 -translate-y-1/2 w-[380px] h-[520px] ...">
    ...
</div>

{/* Secondary Background Card */}
<div className="absolute left-4 top-16 w-[300px] h-[400px] ...">
    ...
</div>
```

Replace both divs (just those two, keep the `motion.div` wrapper) with:
```tsx
<HeroCards />
```

The `motion.div` wrapper at line 223 stays — only the two inner card divs are replaced.

**Step 3: Remove unused imports from page.tsx**

`ImageCompare` and `Sparkle` may now be unused in `page.tsx` (they moved to HeroCards). Check and remove if unused:
- `import { ImageCompare } from '@/components/ui/ImageCompare';`
- `Sparkle` from `@phosphor-icons/react` (check if used elsewhere in page.tsx first)

**Step 4: Run type check**

```bash
cd client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors

**Step 5: Run dev server and verify visually**

```bash
cd client && npm run dev
```

Open `http://localhost:3000` on desktop width (≥1024px). Verify:
- [ ] Both cards visible, main card on right foreground, secondary card on left background
- [ ] Clicking background card: both cards animate with spring — background comes forward
- [ ] Clicking again: swaps back
- [ ] Hint "tap to switch" disappears after first click
- [ ] Hover on background card: subtle scale hint
- [ ] No layout shift, no console errors

**Step 6: Commit**

```bash
git add client/src/app/page.tsx
git commit -m "feat: wire HeroCards into homepage hero section"
```

---

### Task 3: Polish — swap-back on front card click (optional UX improvement)

**Files:**
- Modify: `client/src/features/landing/components/HeroCards.tsx`

Currently only the background card is clickable. For better UX, the foreground card should NOT trigger swap (user is using ImageCompare on it). But if the user wants to go back, they click the now-background card. This is already correct — no change needed.

**Verify:** After swap, the original main card is now in back position and IS clickable (it triggers swap back). The new front card (Card B) is not a click-to-swap trigger. Confirm this matches the desired UX.

If both cards should toggle on click (clicking either one swaps), add `onClick={handleSwap}` to Card A as well. Ask user preference before implementing.

---

## Notes

- `motion/react` is the correct import (not `framer-motion`) — confirmed from existing code in `page.tsx` line 13
- `style={{ zIndex }}` is needed alongside `animate={{ zIndex }}` because Framer Motion animates zIndex as a number but the DOM needs it for stacking context during the animation
- The `whileHover` on Card B only activates when `!swapped` (when it's in background position)
- Both cards use the same Unsplash images — in production these would be different portfolio photos
