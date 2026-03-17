# Masters Map — Design Spec

## Overview
Add an interactive map to the masters catalog showing master locations as pins. Mobile-first with list/map toggle; desktop shows split view.

## Database Changes

### MasterProfile — add fields:
- `latitude Float?`
- `longitude Float?`
- `isManualLocation Boolean @default(false)`
- `@@index([latitude, longitude])`

### District — add fields:
- `latitude Float?`
- `longitude Float?` (center of district for fallback)

## API Changes

### GET /api/v1/masters/catalog
- Add `bounds` query param: `swLat,swLng,neLat,neLng` for map viewport filtering
- Response includes `latitude, longitude, isManualLocation, locationType` per master

### GET /api/v1/districts (existing or new)
- Include `latitude, longitude` in response for fallback pin placement

## Client — Map Library
- `react-leaflet` + `leaflet` (free, OpenStreetMap tiles)

## Client — UX

### Mobile (default)
- List view by default (current catalog)
- Floating button bottom-center: "Map" icon — switches to fullscreen map
- On map view: floating "List" button to switch back
- Tap pin → bottom sheet with mini-card (photo, name, niche, rating, "View Profile" button)
- Filters apply to both views

### Desktop (lg+)
- Split view: list left (~45%), map right (~55%)
- Hover card in list → highlight pin on map
- Click pin → scroll to card in list + highlight
- Filters panel above both

### Pin Types
- Default pin (primary color): salon, home_studio masters
- Different pin (accent/secondary color + icon): mobile, client_visit masters
- Cluster pins when zoomed out (many pins overlap)

### Map Defaults
- Center: Tbilisi (41.7151, 44.8271)
- Default zoom: 12
- Pin placement priority: manual coords > district center coords

## Master Profile — Set Location
- Map picker in master profile edit form
- Click/drag to set pin
- Saves lat/lng + `isManualLocation: true`
- If not set, API uses district center as fallback

## Seed Data
- Add lat/lng to existing districts (Tbilisi districts)
