# Favorites Feature — Design Spec

## Overview

Users (role USER, authenticated only) can save masters and portfolio items to favorites. Two separate categories displayed as tabs on `/favorites`. Masters can see how many times they/their work have been favorited.

## Database

Two tables with unique constraints:

### FavoriteMaster
- `id` (UUID, PK)
- `userId` (FK → User, onDelete: Cascade)
- `masterProfileId` (FK → MasterProfile, onDelete: Cascade)
- `createdAt`
- `@@unique([userId, masterProfileId])`
- `@@index([userId])`, `@@index([masterProfileId])`
- `@@map("favorite_masters")`

### FavoritePortfolioItem
- `id` (UUID, PK)
- `userId` (FK → User, onDelete: Cascade)
- `portfolioItemId` (FK → PortfolioItem, onDelete: Cascade)
- `createdAt`
- `@@unique([userId, portfolioItemId])`
- `@@index([userId])`, `@@index([portfolioItemId])`
- `@@map("favorite_portfolio_items")`

## Server API

Module: `src/modules/favorites/`

All endpoints require authentication (USER role).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/favorites/masters/:masterProfileId` | Add master to favorites |
| DELETE | `/api/v1/favorites/masters/:masterProfileId` | Remove master from favorites |
| GET | `/api/v1/favorites/masters` | List favorite masters (paginated) |
| POST | `/api/v1/favorites/portfolio/:portfolioItemId` | Add portfolio item to favorites |
| DELETE | `/api/v1/favorites/portfolio/:portfolioItemId` | Remove portfolio item from favorites |
| GET | `/api/v1/favorites/portfolio` | List favorite portfolio items (paginated) |
| GET | `/api/v1/favorites/status?masterIds=...&portfolioItemIds=...` | Batch check favorite status |

### Batch Status Response
```json
{
  "success": true,
  "message": "Favorite status retrieved",
  "data": {
    "masters": { "id1": true, "id2": false },
    "portfolioItems": { "id3": true }
  }
}
```

### Favorites Count
Existing master profile and portfolio item endpoints gain a `favoritesCount` field via Prisma `_count`.

## Client

### Feature module: `features/favorites/`

```
features/favorites/
├── components/
│   ├── FavoriteButton.tsx        # Heart toggle, optimistic UI
│   ├── FavoriteMastersGrid.tsx   # Grid of favorite masters
│   └── FavoritePortfolioGrid.tsx # Grid of favorite portfolio items
├── hooks/
│   ├── useFavoriteToggle.ts      # Mutation: add/remove + optimistic update
│   └── useFavoriteStatus.ts      # Query: batch status check
├── services/
│   └── favorites.service.ts      # API calls via apiClient
└── types/
    └── favorites.types.ts        # Interfaces
```

### FavoriteButton
- Heart icon (filled when favorited, outlined when not)
- Optimistic UI — toggles immediately, reverts on error
- Only rendered for authenticated users
- Props: `entityType: 'master' | 'portfolio'`, `entityId: string`

### Favorites Page (`/favorites`)
- Two tabs: "Masters" / "Works" — tab state in URL via `?tab=masters` or `?tab=portfolio`
- Standard pagination
- Reuses existing card components from browse pages
- Empty state per tab

### Integration Points
- Browse masters page — FavoriteButton on each card
- Master profile page — FavoriteButton + favoritesCount display
- Portfolio items — FavoriteButton on each item

## Decisions
- **Two tables** (not polymorphic) for type-safe FK with cascade delete
- **Batch status endpoint** to avoid N+1 when rendering grids
- **Optimistic UI** for instant feedback on toggle
- **Tab state in URL** so tabs are shareable/bookmarkable
