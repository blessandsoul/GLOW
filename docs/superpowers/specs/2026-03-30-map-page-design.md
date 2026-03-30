# Design Spec: `/map` — Full-Screen Master Map Page

**Date:** 2026-03-30
**Status:** Approved

---

## Overview

A dedicated full-screen map discovery page at `/map` for finding beauty masters. Split-screen layout (Airbnb-style): left panel with filters + master list, right panel with interactive Leaflet map.

---

## Layout

### Desktop (lg+)
- Two-column flex layout, height `100dvh` minus header
- **Left panel**: fixed width `~420px`, `overflow-y: scroll` internally
- **Right panel**: `flex-1`, full height map
- Neither column scrolls the page — left panel scrolls internally

### Mobile
- Stacked layout
- Map: `50dvh` on top
- List: `50dvh` bottom, `overflow-y: scroll`

---

## Left Panel — Content (top to bottom)

1. **Search input** — same as `/masters`, magnifying glass icon + clear button
2. **Niche filter** — horizontal scroll row with icons (Eye, HandPalm, PaintBrush, Scissors, Drop, Sparkle)
3. **Filters button** — `Filters (N)` opens drawer/popover with full filter set:
   - City (multi-select)
   - Language
   - Location type
   - District
   - Brand
   - Style tag
   - Master tier
   - Badges (isVerified, isCertified, isHygieneVerified, isQualityProducts, isTopRated)
4. **Result count** — `"42 мастера"` in muted text
5. **Master card list** — compact horizontal cards (~80px height):
   - Avatar 48px (left)
   - Name + niche + rating + city (right)
   - On hover: `bg-primary/5` highlight + corresponding map pin enlarges
6. **Pagination** — Prev/Next buttons at bottom of panel

---

## Map Panel — Behavior

- **Component**: reuse existing `MasterMapView` (Leaflet + CartoDB Voyager tiles)
- **Pins**: reuse existing `MasterPin` — highlights on card hover
- **Popup**: reuse existing `MasterPopupCard` — on pin click, highlights card in list and scrolls to it
- **`onBoundsChange`**: optional — filter masters by visible map bounds with a "Search this area" checkbox
- **Zoom controls**: custom `+`/`-` buttons, `absolute bottom-4 right-4` (zoomControl={false} on MapContainer)

---

## Routing & File Structure

### New files
- `client/src/app/(public)/map/page.tsx` — page entry point
- `client/src/features/masters/components/MapPage.tsx` — main component

### Reused
- `useMastersCatalog` hook — same data fetching
- `MasterMapView`, `MasterPin`, `MasterPopupCard` — existing map components
- All filter state logic from `MastersCatalog`
- `useDistricts`, `useBrands`, `useStyleTags`, `useCatalogLookups`

### URL params
Same as `/masters`: `search`, `niche`, `city`, `page`, `isVerified`, `isCertified`, `isHygieneVerified`, `isQualityProducts`, `isTopRated`, `language`, `locationType`, `district`, `brandSlug`, `styleTagSlug`, `masterTier`

### Navigation
- "Список" button on map page → navigates to `/masters` preserving all query params
- `/masters` list/map toggle → navigates to `/map` preserving all query params (existing toggle behavior updated)

---

## Component: `MapPage.tsx`

```
MapPage
├── Left panel (overflow-y: scroll)
│   ├── SearchInput
│   ├── NicheFilterRow (horizontal scroll)
│   ├── FiltersButton → FiltersDrawer
│   ├── ResultCount
│   ├── MasterCardList (compact cards)
│   │   └── CompactMasterCard (×N)
│   └── Pagination
└── Right panel (flex-1)
    └── MasterMapView
        ├── TileLayer
        ├── MasterPin (×N)
        ├── MasterPopupCard
        └── CustomZoomControls
```

---

## State

- All filter state: `useState` + `useSearchParams` (URL-synced, same as MastersCatalog)
- `highlightedUsername`: shared between list and map via local state
- `selectedMaster`: managed inside `MasterMapView` (unchanged)

---

## Design Tokens

- Left panel bg: `bg-background`
- Card hover: `bg-primary/5`
- Border between panels: `border-r border-border`
- Niche pill active: `bg-primary text-primary-foreground`
- Niche pill inactive: `bg-muted text-muted-foreground hover:bg-muted/80`
- Zoom buttons: `bg-background border border-border shadow-sm rounded-lg`

---

## Accessibility

- Tab order: search → niche filters → filters button → card list → pagination
- Map pins: `aria-label` with master name
- Focus ring on all interactive elements: `focus-visible:ring-2 focus-visible:ring-primary/50`
