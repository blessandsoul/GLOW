---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Design System

## Philosophy: "Neuro-Minimalism"

Clean, airy, "expensive" look inspired by Linear, Vercel, Stripe, Arc. Every visual decision reduces cognitive load.

---

## CSS Variables (Source of Truth)

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    --brand-primary: 221.2 83.2% 53.3%;
    --brand-secondary: 142.1 76.2% 36.3%;
    --brand-accent: 24.6 95% 53.1%;
    --success: 142.1 76.2% 36.3%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --info: 199 89% 48%;
    --info-foreground: 0 0% 100%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

## Color Usage

| Token | Purpose | Example use |
|---|---|---|
| `primary` | Main CTAs, links, active states | "Book appointment" button |
| `secondary` | Secondary actions | Cancel, back |
| `destructive` | Delete, errors | Delete button, error alert |
| `success` | Success states | "Appointment confirmed" |
| `warning` | Warnings | "Payment pending" |
| `info` | Information | "New feature" badge |
| `muted` | Disabled, placeholders | Disabled input |
| `accent` | Highlights | "20% off" badge |
| `card` | Card backgrounds | Service card |
| `border` | Borders, dividers | Card border |

### Color Rules

1. **Never hardcode**: No `bg-blue-500`, no `bg-[#3b82f6]`, no `style={{ color }}`. Always semantic tokens.
2. **Semantic names by purpose**: `bg-destructive` not `bg-red`.
3. **Always pair bg + foreground**: `bg-primary text-primary-foreground` for contrast.
4. **Single source of truth**: Change colors only in `globals.css` variables.
5. **90% monochrome**: 90% of UI uses `background`, `foreground`, `muted`, `border`. Color is the exception.
6. **Opacity for hierarchy**: Use `bg-primary/10`, `bg-primary/5` for tinted backgrounds.

---

## Surfaces & Depth

- **Border radius**: `rounded-xl` (12px) or `rounded-2xl` (16px) for cards, modals, containers.
- **Shadows** (layered by elevation):
  - Resting cards: `shadow-sm`
  - Hovered/elevated: `shadow-md` to `shadow-lg`
  - Modals/popovers: `shadow-xl`
- **Glassmorphism**: Only on sticky headers, floating toolbars, modal backdrops. Never on content cards.
  `backdrop-filter: blur(12px) saturate(1.5); background: hsl(var(--background) / 0.8);`
- **No pure black/white**: Use `--background` and `--foreground` tokens (already off-pure).

---

## Typography

- **Font**: Inter v4 (variable) or Geist Sans via `next/font`. Georgian: Noto Sans Georgian.
- **Headings**: `text-wrap: balance`, `leading-tight`. H1: `text-3xl`–`text-4xl`, H2: `text-2xl`.
- **Body**: `text-base`, `leading-relaxed`. Max reading width: `max-w-prose` (~65ch).
- **Data/numbers**: Always `tabular-nums` for alignment.
- **Captions/meta**: `text-sm text-muted-foreground`.

---

## Spacing

- **Whitespace IS the divider.** Prefer spacing over visible borders/lines.
- **Section gap = 2x internal gap**: `space-y-16` between sections, `space-y-6` within.
- **Stick to scale**: `4, 6, 8, 12, 16, 20, 24` from Tailwind. Avoid arbitrary values.
- **Container**: `container mx-auto px-4 md:px-6 lg:px-8`.

---

## Motion & Interactions

Every interactive element MUST have visible `:hover`, `:active`, and `:focus-visible` states.

### Standard Patterns
```
Button:  transition-all duration-200 ease-out hover:brightness-110 active:scale-[0.98]
Card:    transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5
Link:    transition-colors duration-150 hover:text-primary
```

### Rules
- **Transform + opacity only** — never animate layout properties (`width`, `height`, `top`).
- **Respect `prefers-reduced-motion`**: Use `motion-safe:` / `motion-reduce:` variants.
- **Motion budget**: Max 2-3 animated elements in viewport at once.
- **Zero CLS**: Animations must never cause layout shift.

---

## Images

- **Format priority**: AVIF > WebP > JPEG (Next.js `<Image>` handles this).
- **LCP image**: Always add `priority` prop.
- **Blur placeholder**: Use `placeholder="blur"` with `blurDataURL`.
- **Always set** explicit `width`/`height` or use `aspect-ratio` to prevent CLS.

---

## Modern CSS Features (Use Where Appropriate)

| Feature | Use for |
|---|---|
| `@container` | Component-level responsive behavior |
| CSS Subgrid | Child alignment with parent grid |
| `dvh` | Full-height layouts (avoids mobile browser bar) |
| `<dialog>` | Modals (with glassmorphism backdrop) |
| Popover API | Dropdowns, tooltips |
| `:has()` | Parent-based styling without JS |
| `content-visibility: auto` | Long lists/pages performance |
| `@starting-style` | Entry animations |

---

## Component Visual Patterns

- **Cards**: `rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`
- **Empty states**: Centered, muted icon, 2-line text max, one clear CTA.
- **Loading**: Skeleton loaders matching content shape. Show immediately, no delay.
- **Modals**: Max `max-w-lg`. Dismissible with Escape + backdrop click. Glassmorphism backdrop.

---

## Dark Mode

- Use `next-themes` with `attribute="class"`, `defaultTheme="system"`.
- Reduce shadow visibility in dark mode (use subtle light borders instead).
- Consider `brightness-90` on images in dark mode.
- Add `suppressHydrationWarning` to `<html>` tag.
