# Masters Map Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive map with master location pins to the masters catalog page — mobile-first toggle, desktop split view.

**Architecture:** Add lat/lng fields to MasterProfile and District in Prisma. Extend catalog API to return coordinates and support map bounds filtering. Client uses `react-leaflet` with OpenStreetMap tiles. MastersCatalog gets a map/list toggle (mobile) or side-by-side layout (desktop).

**Tech Stack:** Prisma (migration), Fastify (API), react-leaflet + leaflet (map), Tailwind (styling)

---

## Task 1: Database Migration — Add coordinates

**Files:**
- Modify: `server/prisma/schema.prisma` (MasterProfile model ~line 192, District model ~line 398)
- Create: migration via `prisma:migrate dev`

- [ ] **Step 1: Add lat/lng fields to MasterProfile**

In `server/prisma/schema.prisma`, add to `MasterProfile` model (after `districtId` field, ~line 210):

```prisma
  latitude           Float?
  longitude          Float?
  isManualLocation   Boolean @default(false)
```

And add index (before `@@map`):

```prisma
  @@index([latitude, longitude])
```

- [ ] **Step 2: Add lat/lng fields to District**

In the `District` model (~line 398), add after `isActive`:

```prisma
  latitude  Float?
  longitude Float?
```

- [ ] **Step 3: Run migration**

```bash
cd server && npm run prisma:migrate dev -- --name add_coordinates_to_master_and_district
```

- [ ] **Step 4: Update District seed data with Tbilisi district coordinates**

In `server/prisma/seed.ts`, update district seed data to include lat/lng for each district. Use these approximate Tbilisi district centers:

```typescript
const DISTRICT_COORDS: Record<string, { latitude: number; longitude: number }> = {
  vake: { latitude: 41.7087, longitude: 44.7465 },
  saburtalo: { latitude: 41.7275, longitude: 44.7460 },
  vera: { latitude: 41.7100, longitude: 44.7835 },
  mtatsminda: { latitude: 41.6940, longitude: 44.7920 },
  'old-tbilisi': { latitude: 41.6900, longitude: 44.8075 },
  gldani: { latitude: 41.7690, longitude: 44.8140 },
  nadzaladevi: { latitude: 41.7480, longitude: 44.8020 },
  didube: { latitude: 41.7370, longitude: 44.7800 },
  chugureti: { latitude: 41.7080, longitude: 44.8060 },
  isani: { latitude: 41.6950, longitude: 44.8270 },
  samgori: { latitude: 41.7060, longitude: 44.8520 },
  dighomi: { latitude: 41.7550, longitude: 44.7530 },
  avlabari: { latitude: 41.6930, longitude: 44.8130 },
  ortachala: { latitude: 41.6830, longitude: 44.8170 },
  'varketili': { latitude: 41.6870, longitude: 44.8850 },
};
```

After upserting districts, update them with coordinates:

```typescript
for (const [slug, coords] of Object.entries(DISTRICT_COORDS)) {
  await prisma.district.updateMany({
    where: { slug },
    data: coords,
  });
}
```

- [ ] **Step 5: Run seed**

```bash
cd server && npm run prisma:seed
```

- [ ] **Step 6: Regenerate Prisma client**

```bash
cd server && npm run prisma:generate
```

- [ ] **Step 7: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/ server/prisma/seed.ts
git commit -m "feat: add lat/lng coordinates to MasterProfile and District"
```

---

## Task 2: Server — Extend catalog API to return coordinates

**Files:**
- Modify: `server/src/modules/masters/masters.repo.ts`
- Modify: `server/src/modules/masters/masters.controller.ts`

- [ ] **Step 1: Add coordinates to MASTER_SELECT in masters.repo.ts**

In `server/src/modules/masters/masters.repo.ts`, add to the `masterProfile.select` object (~line 30, after `workingHours: true`):

```typescript
      latitude: true,
      longitude: true,
      isManualLocation: true,
```

Also add to `district.select` (~line 43):

```typescript
        select: { name: true, slug: true, latitude: true, longitude: true },
```

- [ ] **Step 2: Add coordinates to mapMaster function**

In `mapMaster` function (~line 135), add after `district: p?.district ?? null,`:

```typescript
    latitude: p?.latitude ?? p?.district?.latitude ?? null,
    longitude: p?.longitude ?? p?.district?.longitude ?? null,
    isManualLocation: p?.isManualLocation ?? false,
```

This implements the fallback logic: manual coords → district center coords → null.

- [ ] **Step 3: Add bounds filtering to buildWhere**

In `buildWhere` function, add `bounds` parameter to the options type:

```typescript
  bounds?: { swLat: number; swLng: number; neLat: number; neLng: number };
```

Add bounds filtering logic after the existing filters (before `return where`):

```typescript
  if (opts?.bounds) {
    profileConditions.latitude = { gte: opts.bounds.swLat, lte: opts.bounds.neLat };
    profileConditions.longitude = { gte: opts.bounds.swLng, lte: opts.bounds.neLng };
  }
```

- [ ] **Step 4: Add bounds to CatalogFilters interface and findCatalogMasters**

Add to `CatalogFilters` interface:

```typescript
  bounds?: { swLat: number; swLng: number; neLat: number; neLng: number };
```

Pass `bounds` through in `findCatalogMasters` to `buildWhere`.

- [ ] **Step 5: Add bounds query params to controller schema**

In `server/src/modules/masters/masters.controller.ts`, add to `CatalogQuerySchema`:

```typescript
  swLat: z.coerce.number().min(-90).max(90).optional(),
  swLng: z.coerce.number().min(-180).max(180).optional(),
  neLat: z.coerce.number().min(-90).max(90).optional(),
  neLng: z.coerce.number().min(-180).max(180).optional(),
```

In `getCatalog`, construct bounds if all 4 params present:

```typescript
const bounds = swLat !== undefined && swLng !== undefined && neLat !== undefined && neLng !== undefined
  ? { swLat, swLng, neLat, neLng }
  : undefined;
```

Pass `bounds` to the service call.

- [ ] **Step 6: Pass bounds through masters.service.ts**

Update `MastersService.getCatalogMasters` to accept and forward `bounds`.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/masters/
git commit -m "feat: add coordinates to catalog API and bounds filtering"
```

---

## Task 3: Server — API endpoint for updating master location

**Files:**
- Check existing profile update endpoint for master profile fields
- Modify if needed to accept `latitude`, `longitude`, `isManualLocation`

- [ ] **Step 1: Find the profile update endpoint**

Check `server/src/modules/users/` or `server/src/modules/profile/` for the endpoint that updates master profile fields (the one that handles `workAddress`, `districtId`, etc.).

- [ ] **Step 2: Add lat/lng to the update schema**

Add to the master profile update Zod schema:

```typescript
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isManualLocation: z.boolean().optional(),
```

- [ ] **Step 3: Ensure the update repo/service passes these fields through**

The existing update logic should already pass through validated fields to Prisma. Verify it does.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/
git commit -m "feat: allow updating master location coordinates via profile API"
```

---

## Task 4: Client — Install react-leaflet and configure

**Files:**
- Modify: `client/package.json`
- Create: `client/src/features/masters/components/map/` directory

- [ ] **Step 1: Install dependencies**

```bash
cd client && npm install leaflet react-leaflet && npm install -D @types/leaflet
```

- [ ] **Step 2: Add Leaflet CSS import**

In `client/src/app/globals.css`, add at the top (after existing imports):

```css
@import "leaflet/dist/leaflet.css";
```

- [ ] **Step 3: Commit**

```bash
git add client/package.json client/package-lock.json client/src/app/globals.css
git commit -m "chore: install react-leaflet and leaflet dependencies"
```

---

## Task 5: Client — Update types and service

**Files:**
- Modify: `client/src/features/masters/types/masters.types.ts`
- Modify: `client/src/features/masters/services/masters.service.ts`

- [ ] **Step 1: Add coordinate fields to FeaturedMaster type**

In `client/src/features/masters/types/masters.types.ts`, add to `FeaturedMaster` interface:

```typescript
    latitude?: number | null;
    longitude?: number | null;
    isManualLocation?: boolean;
```

- [ ] **Step 2: Add bounds to CatalogFilters**

```typescript
    swLat?: number;
    swLng?: number;
    neLat?: number;
    neLng?: number;
```

- [ ] **Step 3: Add MapBounds type**

```typescript
export interface MapBounds {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/features/masters/types/ client/src/features/masters/services/
git commit -m "feat: add coordinate types and bounds filter support to client"
```

---

## Task 6: Client — MasterMapView component

**Files:**
- Create: `client/src/features/masters/components/map/MasterMapView.tsx`
- Create: `client/src/features/masters/components/map/MasterPin.tsx`
- Create: `client/src/features/masters/components/map/MasterPopupCard.tsx`

- [ ] **Step 1: Create MasterPin component**

`client/src/features/masters/components/map/MasterPin.tsx` — custom Leaflet divIcon markers:
- Default pin: primary color circle for salon/home_studio
- Mobile pin: accent color circle with a small car/arrow icon for mobile/client_visit
- Props: `locationType`, `isActive` (highlighted state)

```tsx
'use client';

import { divIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import type { LocationType } from '../../types/masters.types';

interface MasterPinProps {
  position: [number, number];
  locationType: LocationType | null;
  isHighlighted: boolean;
  onClick: () => void;
}

function createPinIcon(locationType: LocationType | null, isHighlighted: boolean): L.DivIcon {
  const isMobile = locationType === 'mobile' || locationType === 'client_visit';
  const size = isHighlighted ? 40 : 32;
  const bgColor = isMobile
    ? 'oklch(0.55 0.15 240)'   // info color
    : 'oklch(0.45 0.2 260)';   // primary color
  const borderColor = isHighlighted ? 'oklch(0.985 0 0)' : 'transparent';

  return divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${bgColor};
      border: 3px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      transition: all 200ms ease-out;
    ">
      ${isMobile ? '<svg style="transform:rotate(45deg);width:14px;height:14px" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>' : '<div style="transform:rotate(45deg);width:10px;height:10px;background:white;border-radius:50%"></div>'}
    </div>`,
  });
}

export function MasterPin({ position, locationType, isHighlighted, onClick }: MasterPinProps): React.ReactElement {
  return (
    <Marker
      position={position}
      icon={createPinIcon(locationType, isHighlighted)}
      eventHandlers={{ click: onClick }}
    />
  );
}
```

- [ ] **Step 2: Create MasterPopupCard component**

`client/src/features/masters/components/map/MasterPopupCard.tsx` — bottom sheet style card on mobile, popup on desktop:

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTES } from '@/lib/constants/routes';
import { getServerImageUrl } from '@/lib/utils/image';
import { MasterBadgesRow } from '../MasterBadges';
import { cn } from '@/lib/utils';
import type { FeaturedMaster } from '../../types/masters.types';

interface MasterPopupCardProps {
  master: FeaturedMaster | null;
  onClose: () => void;
}

export function MasterPopupCard({ master, onClose }: MasterPopupCardProps): React.ReactElement {
  return (
    <AnimatePresence>
      {master && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl border border-border/60 bg-card p-4 shadow-xl lg:bottom-auto lg:left-auto lg:right-4 lg:top-4 lg:w-80"
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>

          <Link href={`${ROUTES.MASTERS}/${master.username}`} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              {master.avatar ? (
                <Image
                  src={getServerImageUrl(master.avatar)}
                  alt={master.displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-semibold text-muted-foreground">
                  {master.displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{master.displayName}</p>
              {master.niche && (
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">{master.niche}</p>
              )}
              {master.district && (
                <p className="mt-0.5 text-xs text-muted-foreground">{master.district.name}</p>
              )}
              {master.badges && <MasterBadgesRow badges={master.badges} size="sm" className="mt-1.5" />}
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Create MasterMapView component**

`client/src/features/masters/components/map/MasterMapView.tsx` — the map itself:

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { MasterPin } from './MasterPin';
import { MasterPopupCard } from './MasterPopupCard';
import type { FeaturedMaster, MapBounds } from '../../types/masters.types';

const TBILISI_CENTER: [number, number] = [41.7151, 44.8271];
const DEFAULT_ZOOM = 12;

interface MasterMapViewProps {
  masters: FeaturedMaster[];
  highlightedUsername: string | null;
  onMasterHover: (username: string | null) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
}

function MapEvents({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }): null {
  useMapEvents({
    moveend: (e) => {
      if (!onBoundsChange) return;
      const map = e.target as LeafletMap;
      const b = map.getBounds();
      onBoundsChange({
        swLat: b.getSouthWest().lat,
        swLng: b.getSouthWest().lng,
        neLat: b.getNorthEast().lat,
        neLng: b.getNorthEast().lng,
      });
    },
  });
  return null;
}

export function MasterMapView({
  masters,
  highlightedUsername,
  onMasterHover,
  onBoundsChange,
  className,
}: MasterMapViewProps): React.ReactElement {
  const [selectedMaster, setSelectedMaster] = useState<FeaturedMaster | null>(null);

  const mastersWithCoords = useMemo(
    () => masters.filter((m) => m.latitude != null && m.longitude != null),
    [masters],
  );

  const handlePinClick = useCallback((master: FeaturedMaster) => {
    setSelectedMaster(master);
    onMasterHover(master.username);
  }, [onMasterHover]);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MapContainer
        center={TBILISI_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full rounded-xl"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onBoundsChange={onBoundsChange} />
        {mastersWithCoords.map((master) => (
          <MasterPin
            key={master.username}
            position={[master.latitude!, master.longitude!]}
            locationType={master.locationType ?? null}
            isHighlighted={master.username === highlightedUsername}
            onClick={() => handlePinClick(master)}
          />
        ))}
      </MapContainer>

      <MasterPopupCard
        master={selectedMaster}
        onClose={() => {
          setSelectedMaster(null);
          onMasterHover(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/features/masters/components/map/
git commit -m "feat: add MasterMapView, MasterPin, and MasterPopupCard components"
```

---

## Task 7: Client — Integrate map into MastersCatalog

**Files:**
- Modify: `client/src/features/masters/components/MastersCatalog.tsx`

- [ ] **Step 1: Add map state and imports**

At the top of `MastersCatalog.tsx`, add:

```tsx
import dynamic from 'next/dynamic';
import { MapTrifold, ListBullets } from '@phosphor-icons/react';

const MasterMapView = dynamic(
  () => import('./map/MasterMapView').then((m) => m.MasterMapView),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" /> },
);
```

Inside the component, add state:

```tsx
const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
const [highlightedUsername, setHighlightedUsername] = useState<string | null>(null);
```

- [ ] **Step 2: Add mobile toggle button**

Add a floating toggle button (visible on mobile only, `lg:hidden`):

```tsx
<button
  onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
  className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] lg:hidden"
>
  {viewMode === 'list' ? (
    <><MapTrifold size={18} weight="fill" /> Map</>
  ) : (
    <><ListBullets size={18} weight="bold" /> List</>
  )}
</button>
```

- [ ] **Step 3: Restructure layout for split view on desktop**

Wrap the existing master cards grid and the map in a flex container:

```tsx
<div className="flex gap-6">
  {/* List — full width on mobile when list mode, 45% on desktop */}
  <div className={cn(
    'w-full lg:w-[45%] lg:block',
    viewMode === 'map' && 'hidden lg:block',
  )}>
    {/* existing master cards grid */}
  </div>

  {/* Map — full screen on mobile when map mode, 55% on desktop */}
  <div className={cn(
    'lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-6rem)] lg:w-[55%]',
    viewMode === 'list' ? 'hidden lg:block' : 'fixed inset-0 z-40 lg:relative lg:inset-auto',
  )}>
    <MasterMapView
      masters={masters}
      highlightedUsername={highlightedUsername}
      onMasterHover={setHighlightedUsername}
    />
  </div>
</div>
```

- [ ] **Step 4: Add hover interaction on master cards**

On each master card in the list, add:

```tsx
onMouseEnter={() => setHighlightedUsername(master.username)}
onMouseLeave={() => setHighlightedUsername(null)}
className={cn(
  existingClasses,
  highlightedUsername === master.username && 'ring-2 ring-primary/50',
)}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/features/masters/components/MastersCatalog.tsx
git commit -m "feat: integrate map view into masters catalog with split layout"
```

---

## Task 8: Client — Location picker in master profile

**Files:**
- Create: `client/src/features/profile/components/LocationPicker.tsx`
- Modify: `client/src/features/profile/components/ProfileSetup.tsx` (or wherever master profile edit is)

- [ ] **Step 1: Create LocationPicker component**

`client/src/features/profile/components/LocationPicker.tsx`:
- Small map (300px height) with a draggable marker
- User clicks or drags to set location
- Shows current lat/lng below map
- "Clear location" button to remove manual coordinates

```tsx
'use client';

import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const TBILISI_CENTER: [number, number] = [41.7151, 44.8271];

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  className?: string;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }): null {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export function LocationPicker({ latitude, longitude, onChange, className }: LocationPickerProps): React.ReactElement {
  const position: [number, number] = latitude && longitude
    ? [latitude, longitude]
    : TBILISI_CENTER;

  const handleClick = useCallback((lat: number, lng: number) => {
    onChange(lat, lng);
  }, [onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-[300px] overflow-hidden rounded-xl border border-border/60">
        <MapContainer center={position} zoom={14} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleClick} />
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} />
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {latitude && longitude
            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Click on the map to set your location'}
        </p>
        {latitude && longitude && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="flex items-center gap-1 text-xs text-destructive transition-colors hover:text-destructive/80"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate LocationPicker into ProfileSetup**

In the master profile edit form, add the `LocationPicker` component after the address/district fields. Wire it to send `latitude`, `longitude`, `isManualLocation: true` on profile save.

Use dynamic import with `ssr: false` since Leaflet needs window.

- [ ] **Step 3: Commit**

```bash
git add client/src/features/profile/components/LocationPicker.tsx client/src/features/profile/components/ProfileSetup.tsx
git commit -m "feat: add location picker map to master profile setup"
```

---

## Task 9: Update Postman collection

**Files:**
- Modify: `server/postman/collection.json` (if exists)

- [ ] **Step 1: Update catalog request with new query params**

Add `swLat`, `swLng`, `neLat`, `neLng` as optional query params to the catalog request.

- [ ] **Step 2: Add example for profile update with coordinates**

Add example body showing `latitude`, `longitude`, `isManualLocation` fields.

- [ ] **Step 3: Commit**

```bash
git add server/postman/
git commit -m "docs: update Postman collection with map-related params"
```

---

## Task 10: Fix Leaflet default marker icon issue in Next.js

**Files:**
- Create: `client/src/features/masters/components/map/leaflet-setup.ts`

- [ ] **Step 1: Create leaflet icon fix**

Leaflet's default marker icons break with webpack. Create setup file:

```typescript
import L from 'leaflet';

// Fix default marker icon paths for webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
```

Import this in `MasterMapView.tsx` and `LocationPicker.tsx`:
```typescript
import './leaflet-setup';
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/masters/components/map/leaflet-setup.ts
git commit -m "fix: configure Leaflet default marker icons for Next.js"
```
