---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Project Structure

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── providers.tsx       # Client providers (Redux, React Query)
│   ├── globals.css         # Global styles
│   ├── (auth)/             # Auth route group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (main)/             # Main route group
│   │   ├── layout.tsx      # Header/Footer layout
│   │   ├── services/
│   │   ├── masters/
│   │   ├── portfolio/
│   │   └── appointments/
│   ├── dashboard/          # Protected routes
│   └── admin/              # Admin routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header, Footer, Sidebar, MainLayout
│   └── common/             # LoadingSpinner, ErrorBoundary, Pagination, EmptyState
├── features/               # Feature modules (domain-driven)
│   └── <domain>/
│       ├── components/
│       ├── hooks/
│       ├── services/       # <domain>.service.ts
│       ├── store/          # <domain>Slice.ts (if needed)
│       ├── types/          # <domain>.types.ts
│       └── actions/        # <domain>.actions.ts (Server Actions)
├── hooks/                  # Global hooks (useDebounce, useLocalStorage, useMediaQuery)
├── lib/
│   ├── api/                # axios.config.ts, api.types.ts
│   ├── constants/          # routes.ts, api-endpoints.ts, app.constants.ts
│   └── utils/              # format.ts, validation.ts, error.ts, cn() helper
├── store/                  # Redux store (index.ts, hooks.ts)
├── types/                  # Global types
└── middleware.ts            # Auth route protection
```

## File Naming

| Type | Pattern | Example |
|---|---|---|
| Component | `PascalCase.tsx` | `ServiceCard.tsx` |
| Page | `folder/page.tsx` | `services/page.tsx` |
| Hook | `use<Name>.ts` | `useAuth.ts` |
| Service | `<domain>.service.ts` | `service.service.ts` |
| Types | `<domain>.types.ts` | `service.types.ts` |
| Redux slice | `<domain>Slice.ts` | `authSlice.ts` |
| Server Action | `<domain>.actions.ts` | `service.actions.ts` |
| Page exports | `default export` | Required by Next.js |
| Everything else | Named exports | `export const ServiceCard` |

## Import Order

1. React / Next.js (`useState`, `useRouter`, `Image`, `Link`)
2. Third-party (`@tanstack/react-query`, `sonner`)
3. UI components (`@/components/ui/*`)
4. Local components
5. Hooks
6. Services
7. Types (always `import type`)
8. Utils (`cn`, `formatDate`)

## Constants

```typescript
// lib/constants/api-endpoints.ts
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    ME: '/users/me',
    UPDATE_ME: '/users/me',
    DELETE_ME: '/users/me',
  },
  SERVICES: {
    LIST: '/services',
    MY_SERVICES: '/services/my',
    CREATE: '/services',
    GET: (id: string) => `/services/${id}`,
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
  },
} as const;

// lib/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SERVICES: {
    LIST: '/services',
    DETAILS: (id: string) => `/services/${id}`,
    MY_SERVICES: '/my-services',
    CREATE: '/services/create',
    EDIT: (id: string) => `/services/${id}/edit`,
  },
} as const;

// lib/constants/app.constants.ts
export const APP_NAME = 'LashMe';
export const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 100 } as const;
export const USER_ROLES = { USER: 'USER', MASTER: 'MASTER', ADMIN: 'ADMIN', SALON: 'SALON' } as const;
export const CURRENCIES = { GEL: 'GEL', USD: 'USD', EUR: 'EUR' } as const;
```

## App Providers

`app/providers.tsx` wraps the app with: **ReduxProvider** (store) → **QueryClientProvider** (React Query) → **Toaster** (sonner, position: top-right).

## Middleware

Protected paths: `/dashboard`, `/profile`, `/my-services`, `/admin` — redirect to `/login` if no token.
Auth paths: `/login`, `/register` — redirect to `/dashboard` if already authenticated.
