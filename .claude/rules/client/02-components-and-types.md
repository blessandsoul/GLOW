---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Components & Types

## Component Rules

- **Server Components by default.** Only add `'use client'` for hooks, state, or event handlers.
- **Max 250 lines** per component. Split if exceeded.
- **Max 5 props.** Group related props into an object if more are needed.
- **Max 3 levels** of JSX nesting. Extract sub-components if deeper.
- **Internal ordering**: hooks → event handlers → effects → early returns → render.
- **Handler naming**: `handle<Event>` for internal handlers, `on<Event>` for callback props.
- **Wrap handlers in `useCallback`** when passed to child components (Client Components only).
- **Use `useMemo`** for expensive computations in Client Components.

### Anti-patterns

- Do NOT add `'use client'` to components that have no interactivity — keep them as Server Components.
- Do NOT fetch data in Client Components when a Server Component can fetch it and pass as props.
- Do NOT use inline styles. Use Tailwind + `cn()` for conditional classes.

---

## TypeScript Rules

- **Strict mode ON.** No `any` — use `unknown` if the type is truly unknown.
- **Explicit return types** on all functions.
- **`interface`** for component props and object shapes. **`type`** for unions, intersections, utilities.
- **Prefer string unions** over enums: `type UserRole = 'USER' | 'MASTER' | 'ADMIN' | 'SALON'`
- **Infer form types from Zod**: `type ServiceFormData = z.infer<typeof serviceSchema>`
- **Always use `import type`** for type-only imports.

---

## API Response Types

```typescript
// lib/api/api.types.ts

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
```

---

## Domain Types

```typescript
// features/auth/types/auth.types.ts

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'MASTER' | 'ADMIN' | 'SALON';

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IAuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
}
```

```typescript
// features/services/types/service.types.ts

export interface BeautyService {
  id: string;
  masterId: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  title: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  durationMinutes?: number;
}

export interface UpdateServiceRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  durationMinutes?: number;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | '-price' | 'title';
}
```
