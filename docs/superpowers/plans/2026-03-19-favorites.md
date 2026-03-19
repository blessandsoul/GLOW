# Favorites Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated users (USER role) to save masters and portfolio items to favorites, view them on a tabbed page, and see favorite counts on profiles.

**Architecture:** Two Prisma models (`FavoriteMaster`, `FavoritePortfolioItem`) with cascading FK. Server module with CRUD + batch status endpoint. Client feature module with `FavoriteButton` component, React Query hooks with optimistic updates, and a tabbed favorites page.

**Tech Stack:** Prisma (MySQL), Fastify, Zod, React Query, Next.js App Router, shadcn/ui Tabs, Phosphor Icons (Heart)

**Spec:** `docs/superpowers/specs/2026-03-19-favorites-design.md`

---

## File Structure

### Server — Create

| File | Responsibility |
|------|---------------|
| `server/src/modules/favorites/favorites.routes.ts` | Route definitions with `authenticate` preHandler |
| `server/src/modules/favorites/favorites.controller.ts` | Input validation (Zod), call service, format responses |
| `server/src/modules/favorites/favorites.service.ts` | Business logic, throw typed errors |
| `server/src/modules/favorites/favorites.repo.ts` | Prisma queries for both favorite tables |
| `server/src/modules/favorites/favorites.schemas.ts` | Zod schemas + inferred types |

### Server — Modify

| File | Change |
|------|--------|
| `server/prisma/schema.prisma` | Add `FavoriteMaster` and `FavoritePortfolioItem` models + relations on `User`, `MasterProfile`, `PortfolioItem` |
| `server/src/app.ts` | Register `favoritesRoutes` with prefix `/api/v1/favorites` |

### Client — Create

| File | Responsibility |
|------|---------------|
| `client/src/features/favorites/types/favorites.types.ts` | Interfaces for favorites data |
| `client/src/features/favorites/services/favorites.service.ts` | API calls via `apiClient` |
| `client/src/features/favorites/hooks/useFavorites.ts` | React Query hooks: toggle mutations, status queries, list queries |
| `client/src/features/favorites/components/FavoriteButton.tsx` | Heart toggle button with optimistic UI |
| `client/src/features/favorites/components/FavoriteMastersGrid.tsx` | Grid of favorited masters with pagination |
| `client/src/features/favorites/components/FavoritePortfolioGrid.tsx` | Grid of favorited portfolio items with pagination |

### Client — Modify

| File | Change |
|------|--------|
| `client/src/lib/constants/api-endpoints.ts` | Add `FAVORITES` endpoints |
| `client/src/app/(main)/favorites/page.tsx` | Replace stub with tabbed favorites page |

---

## Task 1: Database — Prisma Schema + Migration

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add FavoriteMaster and FavoritePortfolioItem models to schema**

Add to `server/prisma/schema.prisma`:

```prisma
model FavoriteMaster {
  id              String        @id @default(uuid())
  userId          String
  masterProfileId String
  createdAt       DateTime      @default(now())

  user          User          @relation("userFavoriteMasters", fields: [userId], references: [id], onDelete: Cascade)
  masterProfile MasterProfile @relation(fields: [masterProfileId], references: [id], onDelete: Cascade)

  @@unique([userId, masterProfileId])
  @@index([userId])
  @@index([masterProfileId])
  @@map("favorite_masters")
}

model FavoritePortfolioItem {
  id              String        @id @default(uuid())
  userId          String
  portfolioItemId String
  createdAt       DateTime      @default(now())

  user          User          @relation("userFavoritePortfolioItems", fields: [userId], references: [id], onDelete: Cascade)
  portfolioItem PortfolioItem @relation(fields: [portfolioItemId], references: [id], onDelete: Cascade)

  @@unique([userId, portfolioItemId])
  @@index([userId])
  @@index([portfolioItemId])
  @@map("favorite_portfolio_items")
}
```

Add relations to existing models:

On `User`:
```prisma
favoriteMasters        FavoriteMaster[]        @relation("userFavoriteMasters")
favoritePortfolioItems FavoritePortfolioItem[]  @relation("userFavoritePortfolioItems")
```

On `MasterProfile`:
```prisma
favoritedBy FavoriteMaster[]
```

On `PortfolioItem`:
```prisma
favoritedBy FavoritePortfolioItem[]
```

- [ ] **Step 2: Run migration**

```bash
cd server && npm run prisma:migrate dev -- --name add_favorites_tables
```

- [ ] **Step 3: Verify migration SQL and generate client**

```bash
cd server && npm run prisma:generate
```

- [ ] **Step 4: Commit**

```bash
git add server/prisma/
git commit -m "feat: add FavoriteMaster and FavoritePortfolioItem tables"
```

---

## Task 2: Server — Schemas

**Files:**
- Create: `server/src/modules/favorites/favorites.schemas.ts`

- [ ] **Step 1: Create Zod schemas**

```typescript
import { z } from 'zod';

export const MasterProfileIdParamSchema = z.object({
  masterProfileId: z.string().uuid(),
});

export const PortfolioItemIdParamSchema = z.object({
  portfolioItemId: z.string().uuid(),
});

export const FavoriteStatusQuerySchema = z.object({
  masterIds: z.string().optional(),         // comma-separated UUIDs
  portfolioItemIds: z.string().optional(),  // comma-separated UUIDs
});

export type MasterProfileIdParam = z.infer<typeof MasterProfileIdParamSchema>;
export type PortfolioItemIdParam = z.infer<typeof PortfolioItemIdParamSchema>;
export type FavoriteStatusQuery = z.infer<typeof FavoriteStatusQuerySchema>;
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/favorites/favorites.schemas.ts
git commit -m "feat: add favorites Zod schemas"
```

---

## Task 3: Server — Repository

**Files:**
- Create: `server/src/modules/favorites/favorites.repo.ts`

- [ ] **Step 1: Create repository with all Prisma queries**

Follow the pattern from `reviews.repo.ts` — plain object with async methods, import `prisma` from `@/libs/prisma.js`.

Methods needed:

```typescript
import { prisma } from '@/libs/prisma.js';

// SELECT objects for joined data
const MASTER_SELECT = {
  id: true,
  masterProfile: {
    select: {
      id: true,
      city: true,
      niche: true,
      verificationStatus: true,
      isCertified: true,
    },
  },
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

const PORTFOLIO_SELECT = {
  id: true,
  imageUrl: true,
  title: true,
  niche: true,
  createdAt: true,
  user: {
    select: {
      username: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

export const favoritesRepo = {
  // --- Master favorites ---
  async addMaster(userId: string, masterProfileId: string) {
    return prisma.favoriteMaster.create({
      data: { userId, masterProfileId },
    });
  },

  async removeMaster(userId: string, masterProfileId: string) {
    return prisma.favoriteMaster.delete({
      where: { userId_masterProfileId: { userId, masterProfileId } },
    });
  },

  async findMasterFavorite(userId: string, masterProfileId: string) {
    return prisma.favoriteMaster.findUnique({
      where: { userId_masterProfileId: { userId, masterProfileId } },
    });
  },

  async listFavoriteMasters(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [items, totalItems] = await prisma.$transaction([
      prisma.favoriteMaster.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          masterProfile: {
            select: {
              id: true,
              city: true,
              niche: true,
              verificationStatus: true,
              isCertified: true,
              user: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              _count: { select: { favoritedBy: true } },
            },
          },
        },
      }),
      prisma.favoriteMaster.count({ where: { userId } }),
    ]);
    return { items, totalItems };
  },

  async getMasterFavoritesCount(masterProfileId: string): Promise<number> {
    return prisma.favoriteMaster.count({ where: { masterProfileId } });
  },

  // --- Portfolio favorites ---
  async addPortfolioItem(userId: string, portfolioItemId: string) {
    return prisma.favoritePortfolioItem.create({
      data: { userId, portfolioItemId },
    });
  },

  async removePortfolioItem(userId: string, portfolioItemId: string) {
    return prisma.favoritePortfolioItem.delete({
      where: { userId_portfolioItemId: { userId, portfolioItemId } },
    });
  },

  async findPortfolioFavorite(userId: string, portfolioItemId: string) {
    return prisma.favoritePortfolioItem.findUnique({
      where: { userId_portfolioItemId: { userId, portfolioItemId } },
    });
  },

  async listFavoritePortfolioItems(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [items, totalItems] = await prisma.$transaction([
      prisma.favoritePortfolioItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          portfolioItem: {
            select: {
              id: true,
              imageUrl: true,
              title: true,
              niche: true,
              createdAt: true,
              user: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
              _count: { select: { favoritedBy: true } },
            },
          },
        },
      }),
      prisma.favoritePortfolioItem.count({ where: { userId } }),
    ]);
    return { items, totalItems };
  },

  // --- Batch status ---
  async checkMasterStatus(userId: string, masterProfileIds: string[]) {
    const rows = await prisma.favoriteMaster.findMany({
      where: { userId, masterProfileId: { in: masterProfileIds } },
      select: { masterProfileId: true },
    });
    const set = new Set(rows.map((r) => r.masterProfileId));
    return Object.fromEntries(masterProfileIds.map((id) => [id, set.has(id)]));
  },

  async checkPortfolioStatus(userId: string, portfolioItemIds: string[]) {
    const rows = await prisma.favoritePortfolioItem.findMany({
      where: { userId, portfolioItemId: { in: portfolioItemIds } },
      select: { portfolioItemId: true },
    });
    const set = new Set(rows.map((r) => r.portfolioItemId));
    return Object.fromEntries(portfolioItemIds.map((id) => [id, set.has(id)]));
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/favorites/favorites.repo.ts
git commit -m "feat: add favorites repository"
```

---

## Task 4: Server — Service

**Files:**
- Create: `server/src/modules/favorites/favorites.service.ts`

- [ ] **Step 1: Create service with business logic**

Follow `reviews.service.ts` pattern — plain object, throw typed errors from `@/shared/errors/errors.js`.

```typescript
import { NotFoundError, ConflictError } from '@/shared/errors/errors.js';
import { favoritesRepo } from './favorites.repo.js';
import { prisma } from '@/libs/prisma.js';

export const favoritesService = {
  // --- Masters ---
  async addMaster(userId: string, masterProfileId: string): Promise<void> {
    const master = await prisma.masterProfile.findUnique({ where: { id: masterProfileId } });
    if (!master) throw new NotFoundError('Master not found', 'MASTER_NOT_FOUND');

    const existing = await favoritesRepo.findMasterFavorite(userId, masterProfileId);
    if (existing) throw new ConflictError('Master already in favorites', 'ALREADY_FAVORITED');

    await favoritesRepo.addMaster(userId, masterProfileId);
  },

  async removeMaster(userId: string, masterProfileId: string): Promise<void> {
    const existing = await favoritesRepo.findMasterFavorite(userId, masterProfileId);
    if (!existing) throw new NotFoundError('Favorite not found', 'FAVORITE_NOT_FOUND');

    await favoritesRepo.removeMaster(userId, masterProfileId);
  },

  async listFavoriteMasters(userId: string, page: number, limit: number) {
    return favoritesRepo.listFavoriteMasters(userId, page, limit);
  },

  // --- Portfolio ---
  async addPortfolioItem(userId: string, portfolioItemId: string): Promise<void> {
    const item = await prisma.portfolioItem.findUnique({ where: { id: portfolioItemId } });
    if (!item) throw new NotFoundError('Portfolio item not found', 'PORTFOLIO_ITEM_NOT_FOUND');

    const existing = await favoritesRepo.findPortfolioFavorite(userId, portfolioItemId);
    if (existing) throw new ConflictError('Portfolio item already in favorites', 'ALREADY_FAVORITED');

    await favoritesRepo.addPortfolioItem(userId, portfolioItemId);
  },

  async removePortfolioItem(userId: string, portfolioItemId: string): Promise<void> {
    const existing = await favoritesRepo.findPortfolioFavorite(userId, portfolioItemId);
    if (!existing) throw new NotFoundError('Favorite not found', 'FAVORITE_NOT_FOUND');

    await favoritesRepo.removePortfolioItem(userId, portfolioItemId);
  },

  async listFavoritePortfolioItems(userId: string, page: number, limit: number) {
    return favoritesRepo.listFavoritePortfolioItems(userId, page, limit);
  },

  // --- Batch status ---
  async getStatus(userId: string, masterIds: string[], portfolioItemIds: string[]) {
    const [masters, portfolioItems] = await Promise.all([
      masterIds.length > 0 ? favoritesRepo.checkMasterStatus(userId, masterIds) : {},
      portfolioItemIds.length > 0 ? favoritesRepo.checkPortfolioStatus(userId, portfolioItemIds) : {},
    ]);
    return { masters, portfolioItems };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/favorites/favorites.service.ts
git commit -m "feat: add favorites service"
```

---

## Task 5: Server — Controller

**Files:**
- Create: `server/src/modules/favorites/favorites.controller.ts`

- [ ] **Step 1: Create controller**

Follow `reviews.controller.ts` — import `successResponse`/`paginatedResponse`, parse with Zod, call service.

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import { PaginationSchema } from '@/shared/schemas/pagination.schema.js';
import {
  MasterProfileIdParamSchema,
  PortfolioItemIdParamSchema,
  FavoriteStatusQuerySchema,
} from './favorites.schemas.js';
import { favoritesService } from './favorites.service.js';

export const favoritesController = {
  async addMaster(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterProfileId } = MasterProfileIdParamSchema.parse(request.params);
    await favoritesService.addMaster(request.user.id, masterProfileId);
    reply.status(201).send(successResponse('Master added to favorites', null));
  },

  async removeMaster(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterProfileId } = MasterProfileIdParamSchema.parse(request.params);
    await favoritesService.removeMaster(request.user.id, masterProfileId);
    reply.send(successResponse('Master removed from favorites', null));
  },

  async listFavoriteMasters(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit } = PaginationSchema.parse(request.query);
    const { items, totalItems } = await favoritesService.listFavoriteMasters(request.user.id, page, limit);
    reply.send(paginatedResponse('Favorite masters retrieved', items, page, limit, totalItems));
  },

  async addPortfolioItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { portfolioItemId } = PortfolioItemIdParamSchema.parse(request.params);
    await favoritesService.addPortfolioItem(request.user.id, portfolioItemId);
    reply.status(201).send(successResponse('Portfolio item added to favorites', null));
  },

  async removePortfolioItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { portfolioItemId } = PortfolioItemIdParamSchema.parse(request.params);
    await favoritesService.removePortfolioItem(request.user.id, portfolioItemId);
    reply.send(successResponse('Portfolio item removed from favorites', null));
  },

  async listFavoritePortfolioItems(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit } = PaginationSchema.parse(request.query);
    const { items, totalItems } = await favoritesService.listFavoritePortfolioItems(request.user.id, page, limit);
    reply.send(paginatedResponse('Favorite portfolio items retrieved', items, page, limit, totalItems));
  },

  async getStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { masterIds, portfolioItemIds } = FavoriteStatusQuerySchema.parse(request.query);
    const masterIdList = masterIds ? masterIds.split(',').filter(Boolean) : [];
    const portfolioIdList = portfolioItemIds ? portfolioItemIds.split(',').filter(Boolean) : [];
    const status = await favoritesService.getStatus(request.user.id, masterIdList, portfolioIdList);
    reply.send(successResponse('Favorite status retrieved', status));
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/favorites/favorites.controller.ts
git commit -m "feat: add favorites controller"
```

---

## Task 6: Server — Routes + Registration

**Files:**
- Create: `server/src/modules/favorites/favorites.routes.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create routes**

```typescript
import type { FastifyInstance } from 'fastify';
import { authenticate } from '@/libs/auth.js';
import { favoritesController } from './favorites.controller.js';

export async function favoritesRoutes(app: FastifyInstance): Promise<void> {
  // Masters
  app.post('/masters/:masterProfileId', { preHandler: [authenticate] }, favoritesController.addMaster);
  app.delete('/masters/:masterProfileId', { preHandler: [authenticate] }, favoritesController.removeMaster);
  app.get('/masters', { preHandler: [authenticate] }, favoritesController.listFavoriteMasters);

  // Portfolio items
  app.post('/portfolio/:portfolioItemId', { preHandler: [authenticate] }, favoritesController.addPortfolioItem);
  app.delete('/portfolio/:portfolioItemId', { preHandler: [authenticate] }, favoritesController.removePortfolioItem);
  app.get('/portfolio', { preHandler: [authenticate] }, favoritesController.listFavoritePortfolioItems);

  // Batch status
  app.get('/status', { preHandler: [authenticate] }, favoritesController.getStatus);
}
```

- [ ] **Step 2: Register routes in app.ts**

Add import at top:
```typescript
import { favoritesRoutes } from '@/modules/favorites/favorites.routes.js';
```

Add registration alongside existing routes:
```typescript
await app.register(favoritesRoutes, { prefix: '/api/v1/favorites' });
```

- [ ] **Step 3: Verify server compiles**

```bash
cd server && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/favorites/favorites.routes.ts server/src/app.ts
git commit -m "feat: add favorites routes and register in app"
```

---

## Task 7: Server — Postman Collection

**Files:**
- Modify: `server/postman/collection.json`

- [ ] **Step 1: Add Favorites folder to Postman collection**

Add a `Favorites` folder with requests:
- `Add Master to Favorites` → POST `{{baseUrl}}/favorites/masters/{{masterProfileId}}`
- `Remove Master from Favorites` → DELETE `{{baseUrl}}/favorites/masters/{{masterProfileId}}`
- `List Favorite Masters` → GET `{{baseUrl}}/favorites/masters?page=1&limit=10`
- `Add Portfolio Item to Favorites` → POST `{{baseUrl}}/favorites/portfolio/{{portfolioItemId}}`
- `Remove Portfolio Item from Favorites` → DELETE `{{baseUrl}}/favorites/portfolio/{{portfolioItemId}}`
- `List Favorite Portfolio Items` → GET `{{baseUrl}}/favorites/portfolio?page=1&limit=10`
- `Check Favorite Status` → GET `{{baseUrl}}/favorites/status?masterIds={{masterProfileId}}&portfolioItemIds={{portfolioItemId}}`

All use inherited Bearer Token auth from collection root.

- [ ] **Step 2: Commit**

```bash
git add server/postman/
git commit -m "docs: add favorites endpoints to Postman collection"
```

---

## Task 8: Client — Types + API Endpoints + Service

**Files:**
- Create: `client/src/features/favorites/types/favorites.types.ts`
- Create: `client/src/features/favorites/services/favorites.service.ts`
- Modify: `client/src/lib/constants/api-endpoints.ts`

- [ ] **Step 1: Add FAVORITES to API endpoints constant**

```typescript
FAVORITES: {
  MASTERS: {
    LIST: '/favorites/masters',
    ADD: (masterProfileId: string) => `/favorites/masters/${masterProfileId}`,
    REMOVE: (masterProfileId: string) => `/favorites/masters/${masterProfileId}`,
  },
  PORTFOLIO: {
    LIST: '/favorites/portfolio',
    ADD: (portfolioItemId: string) => `/favorites/portfolio/${portfolioItemId}`,
    REMOVE: (portfolioItemId: string) => `/favorites/portfolio/${portfolioItemId}`,
  },
  STATUS: '/favorites/status',
},
```

- [ ] **Step 2: Create types**

```typescript
import type { PaginationParams } from '@/lib/api/api.types';

export interface FavoriteMasterItem {
  id: string;
  createdAt: string;
  masterProfile: {
    id: string;
    city: string | null;
    niche: string | null;
    verificationStatus: string;
    isCertified: boolean;
    user: {
      username: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    _count: {
      favoritedBy: number;
    };
  };
}

export interface FavoritePortfolioItemItem {
  id: string;
  createdAt: string;
  portfolioItem: {
    id: string;
    imageUrl: string;
    title: string | null;
    niche: string | null;
    createdAt: string;
    user: {
      username: string;
      firstName: string;
      lastName: string;
    };
    _count: {
      favoritedBy: number;
    };
  };
}

export interface FavoriteStatusResponse {
  masters: Record<string, boolean>;
  portfolioItems: Record<string, boolean>;
}

export type FavoriteTab = 'masters' | 'portfolio';
```

- [ ] **Step 3: Create service class**

Follow `review.service.ts` pattern — class with singleton export, returns unwrapped `data`.

```typescript
import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse, PaginationParams } from '@/lib/api/api.types';
import type { FavoriteMasterItem, FavoritePortfolioItemItem, FavoriteStatusResponse } from '../types/favorites.types';

class FavoritesService {
  // Masters
  async addMaster(masterProfileId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.FAVORITES.MASTERS.ADD(masterProfileId));
  }

  async removeMaster(masterProfileId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FAVORITES.MASTERS.REMOVE(masterProfileId));
  }

  async listFavoriteMasters(params?: PaginationParams): Promise<PaginatedApiResponse<FavoriteMasterItem>['data']> {
    const { data } = await apiClient.get<PaginatedApiResponse<FavoriteMasterItem>>(
      API_ENDPOINTS.FAVORITES.MASTERS.LIST,
      { params },
    );
    return data.data;
  }

  // Portfolio
  async addPortfolioItem(portfolioItemId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.FAVORITES.PORTFOLIO.ADD(portfolioItemId));
  }

  async removePortfolioItem(portfolioItemId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FAVORITES.PORTFOLIO.REMOVE(portfolioItemId));
  }

  async listFavoritePortfolioItems(params?: PaginationParams): Promise<PaginatedApiResponse<FavoritePortfolioItemItem>['data']> {
    const { data } = await apiClient.get<PaginatedApiResponse<FavoritePortfolioItemItem>>(
      API_ENDPOINTS.FAVORITES.PORTFOLIO.LIST,
      { params },
    );
    return data.data;
  }

  // Status
  async getStatus(masterIds?: string[], portfolioItemIds?: string[]): Promise<FavoriteStatusResponse> {
    const params: Record<string, string> = {};
    if (masterIds?.length) params.masterIds = masterIds.join(',');
    if (portfolioItemIds?.length) params.portfolioItemIds = portfolioItemIds.join(',');
    const { data } = await apiClient.get<ApiResponse<FavoriteStatusResponse>>(
      API_ENDPOINTS.FAVORITES.STATUS,
      { params },
    );
    return data.data;
  }
}

export const favoritesService = new FavoritesService();
```

- [ ] **Step 4: Commit**

```bash
git add client/src/features/favorites/types/ client/src/features/favorites/services/ client/src/lib/constants/api-endpoints.ts
git commit -m "feat: add favorites types, service, and API endpoints"
```

---

## Task 9: Client — React Query Hooks

**Files:**
- Create: `client/src/features/favorites/hooks/useFavorites.ts`

- [ ] **Step 1: Create hooks with query key factory, list queries, toggle mutations, and status query**

Follow `useReview.ts` pattern. Key behaviors:
- `useFavoriteToggle` — single hook that handles both add/remove for both entity types, with optimistic update on the status query
- `useFavoriteStatus` — batch status check for rendering heart icons on grids
- `useFavoriteMasters` / `useFavoritePortfolioItems` — paginated list queries

```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/error';
import { favoritesService } from '../services/favorites.service';
import type { FavoriteStatusResponse } from '../types/favorites.types';

export const favoriteKeys = {
  all: ['favorites'] as const,
  masters: () => [...favoriteKeys.all, 'masters'] as const,
  mastersList: (page: number, limit: number) => [...favoriteKeys.masters(), { page, limit }] as const,
  portfolio: () => [...favoriteKeys.all, 'portfolio'] as const,
  portfolioList: (page: number, limit: number) => [...favoriteKeys.portfolio(), { page, limit }] as const,
  status: (masterIds: string[], portfolioItemIds: string[]) =>
    [...favoriteKeys.all, 'status', { masterIds, portfolioItemIds }] as const,
};

export function useFavoriteMasters(page: number, limit: number) {
  return useQuery({
    queryKey: favoriteKeys.mastersList(page, limit),
    queryFn: () => favoritesService.listFavoriteMasters({ page, limit }),
  });
}

export function useFavoritePortfolioItems(page: number, limit: number) {
  return useQuery({
    queryKey: favoriteKeys.portfolioList(page, limit),
    queryFn: () => favoritesService.listFavoritePortfolioItems({ page, limit }),
  });
}

export function useFavoriteStatus(masterIds: string[], portfolioItemIds: string[]) {
  return useQuery({
    queryKey: favoriteKeys.status(masterIds, portfolioItemIds),
    queryFn: () => favoritesService.getStatus(masterIds, portfolioItemIds),
    enabled: masterIds.length > 0 || portfolioItemIds.length > 0,
  });
}

export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  const toggleMaster = useMutation({
    mutationFn: ({ masterProfileId, isFavorited }: { masterProfileId: string; isFavorited: boolean }) =>
      isFavorited
        ? favoritesService.removeMaster(masterProfileId)
        : favoritesService.addMaster(masterProfileId),
    onSuccess: (_data, { isFavorited }) => {
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const togglePortfolioItem = useMutation({
    mutationFn: ({ portfolioItemId, isFavorited }: { portfolioItemId: string; isFavorited: boolean }) =>
      isFavorited
        ? favoritesService.removePortfolioItem(portfolioItemId)
        : favoritesService.addPortfolioItem(portfolioItemId),
    onSuccess: (_data, { isFavorited }) => {
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  return { toggleMaster, togglePortfolioItem };
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/favorites/hooks/
git commit -m "feat: add favorites React Query hooks"
```

---

## Task 10: Client — FavoriteButton Component

**Files:**
- Create: `client/src/features/favorites/components/FavoriteButton.tsx`

- [ ] **Step 1: Create FavoriteButton**

Heart icon toggle with optimistic visual state. Only renders for authenticated users.

```typescript
'use client';

import { useCallback, useState } from 'react';
import { Heart } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useFavoriteToggle } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  entityType: 'master' | 'portfolio';
  entityId: string;
  isFavorited: boolean;
  size?: number;
  className?: string;
}

export function FavoriteButton({
  entityType,
  entityId,
  isFavorited,
  size = 20,
  className,
}: FavoriteButtonProps): JSX.Element {
  const { toggleMaster, togglePortfolioItem } = useFavoriteToggle();
  const [optimistic, setOptimistic] = useState(isFavorited);

  // Sync optimistic state when prop changes (e.g., after refetch)
  if (isFavorited !== optimistic && !toggleMaster.isPending && !togglePortfolioItem.isPending) {
    setOptimistic(isFavorited);
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOptimistic((prev) => !prev);

      const mutation = entityType === 'master' ? toggleMaster : togglePortfolioItem;
      const payload =
        entityType === 'master'
          ? { masterProfileId: entityId, isFavorited: optimistic }
          : { portfolioItemId: entityId, isFavorited: optimistic };

      // @ts-expect-error — union discrimination handled by entityType
      mutation.mutate(payload, {
        onError: () => setOptimistic(optimistic), // revert on error
      });
    },
    [entityType, entityId, optimistic, toggleMaster, togglePortfolioItem],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={optimistic ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm',
        'transition-all duration-200 hover:scale-110 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className,
      )}
    >
      <Heart
        size={size}
        weight={optimistic ? 'fill' : 'regular'}
        className={cn(
          'transition-colors duration-200',
          optimistic ? 'text-destructive' : 'text-foreground/60',
        )}
      />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/favorites/components/FavoriteButton.tsx
git commit -m "feat: add FavoriteButton component with optimistic UI"
```

---

## Task 11: Client — Favorites Page (Grids + Tabs)

**Files:**
- Create: `client/src/features/favorites/components/FavoriteMastersGrid.tsx`
- Create: `client/src/features/favorites/components/FavoritePortfolioGrid.tsx`
- Modify: `client/src/app/(main)/favorites/page.tsx`

- [ ] **Step 1: Create FavoriteMastersGrid**

Paginated grid of favorite masters. Reuses card layout pattern from `MastersCatalog`. Shows empty state when no favorites.

- [ ] **Step 2: Create FavoritePortfolioGrid**

Paginated grid of favorite portfolio items. Shows empty state when no favorites.

- [ ] **Step 3: Rewrite favorites page**

Replace stub with tabbed page using shadcn `Tabs`. Tab state stored in URL search params (`?tab=masters` or `?tab=portfolio`). Default tab: `masters`.

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FavoriteMastersGrid } from '@/features/favorites/components/FavoriteMastersGrid';
import { FavoritePortfolioGrid } from '@/features/favorites/components/FavoritePortfolioGrid';
import type { FavoriteTab } from '@/features/favorites/types/favorites.types';

export default function FavoritesPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get('tab') as FavoriteTab) || 'masters';

  const handleTabChange = (value: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/favorites?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Favorites</h1>
      <Tabs value={tab} onValueChange={handleTabChange} className="mt-6">
        <TabsList>
          <TabsTrigger value="masters">Masters</TabsTrigger>
          <TabsTrigger value="portfolio">Works</TabsTrigger>
        </TabsList>
        <TabsContent value="masters" className="mt-6">
          <FavoriteMastersGrid />
        </TabsContent>
        <TabsContent value="portfolio" className="mt-6">
          <FavoritePortfolioGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/features/favorites/components/ client/src/app/(main)/favorites/page.tsx
git commit -m "feat: add favorites page with tabs, grids, and pagination"
```

---

## Task 12: Client — Integration (FavoriteButton on existing pages)

**Files:**
- Modify: Master card components (where masters are rendered in grids/lists)
- Modify: Portfolio item components (where portfolio items are rendered)

- [ ] **Step 1: Identify exact integration points**

Read the current master card and portfolio item components to find the precise JSX locations for overlaying `FavoriteButton`.

- [ ] **Step 2: Add FavoriteButton to master cards**

Overlay `FavoriteButton` in the top-right corner of master card image area using `absolute right-2 top-2`. Only render when user is authenticated. Use `useFavoriteStatus` at the grid level to batch-check status, pass `isFavorited` prop down.

- [ ] **Step 3: Add FavoriteButton to portfolio items**

Same pattern — overlay on portfolio item image area.

- [ ] **Step 4: Verify no regressions**

```bash
cd client && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add client/src/features/masters/ client/src/features/portfolio/
git commit -m "feat: integrate FavoriteButton into master and portfolio cards"
```

---

## Task 13: Server — Add favoritesCount to existing endpoints

**Files:**
- Modify: Master profile repo/service (add `_count.favoritedBy` to select)
- Modify: Portfolio item repo (add `_count.favoritedBy` to select)

- [ ] **Step 1: Find the exact SELECT objects used in master profile and portfolio queries**

Read the repos to find where to add `_count`.

- [ ] **Step 2: Add `_count: { select: { favoritedBy: true } }` to relevant Prisma selects**

- [ ] **Step 3: Verify server compiles**

```bash
cd server && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/
git commit -m "feat: add favoritesCount to master profile and portfolio responses"
```
