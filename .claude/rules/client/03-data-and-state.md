---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Data, State & API Integration

## State Decision Matrix

| State Type | Tool | When |
|---|---|---|
| Server data (initial page load) | Server Components | SEO-critical, page-level data |
| Server data (client-triggered) | React Query | User actions, real-time updates, mutations |
| Global client state | Redux | Auth tokens, current user — **nothing else** |
| Local UI state | `useState` / `useReducer` | Modals, hover, form inputs |
| URL-shareable state | `useSearchParams` | Filters, pagination, search query |

### Anti-patterns

- **No server state in Redux.** Use Server Components or React Query.
- **No UI state in Redux** (modals, loading). Use local state.
- **Prefer Server Component fetch** over client-side `useQuery` when the data is available at page level.

---

## React Query Config

Defaults in `app/providers.tsx`:

```typescript
staleTime: 5 * 60 * 1000    // 5 min
gcTime: 10 * 60 * 1000      // 10 min
refetchOnWindowFocus: false
retry: 1
```

### Query Key Factory Pattern

```typescript
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: ServiceFilters) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};
```

### Mutations

On success: invalidate related queries, show toast, navigate if needed.
On error: `toast.error(getErrorMessage(error))`.

---

## Redux

**Scope**: Auth only. Single slice: `authSlice` with actions: `setCredentials`, `updateTokens`, `logout`.

Typed hooks in `store/hooks.ts`: `useAppDispatch`, `useAppSelector`.

State shape:
```typescript
{ user: IUser | null; tokens: IAuthTokens | null; isAuthenticated: boolean }
```

Persisted to `localStorage` with SSR guard (`typeof window !== 'undefined'`).

---

## Axios Config

`lib/api/axios.config.ts` — singleton `apiClient`:

- **Base URL**: `process.env.NEXT_PUBLIC_API_BASE_URL` (fallback `http://localhost:3000/api/v1`)
- **Timeout**: 30s
- **Request interceptor**: Attaches `Authorization: Bearer <accessToken>` from Redux store (client-side only).
- **Response interceptor**: On 401, attempts token refresh via `/auth/refresh`. If refresh fails, dispatches `logout()` and redirects to `/login`.

---

## Service Pattern

Services are **classes**, singleton-exported, using `apiClient` and `API_ENDPOINTS`.

```typescript
class BeautyServiceApi {
  async getServices(params?: ServiceFilters & PaginationParams): Promise<PaginatedData<BeautyService>>
  async getService(id: string): Promise<BeautyService>
  async createService(data: CreateServiceRequest): Promise<BeautyService>
  async updateService(id: string, data: UpdateServiceRequest): Promise<BeautyService>
  async deleteService(id: string): Promise<void>
}
export const beautyServiceApi = new BeautyServiceApi();
```

Auth service methods: `register`, `login`, `logout`, `refreshToken`, `getMe`, `verifyEmail`, `requestPasswordReset`, `resetPassword`.

---

## Error Handling

```typescript
// lib/utils/error.ts
export const getErrorMessage = (error: unknown): string => {
  // Checks: axios error → ApiError shape → network error → generic Error → fallback string
};
```

**Toast library**: `sonner`. Use `toast.success()`, `toast.error(getErrorMessage(error))`.

---

## Next.js Caching Defaults

| Data type | Strategy | Example |
|---|---|---|
| General content | `next: { revalidate: 60 }` | Services list |
| User-specific | `cache: 'no-store'` | User profile |
| Static lookups | `cache: 'force-cache'` | Locations, categories |

Use `revalidatePath()` / `revalidateTag()` in Server Actions after mutations.

---

## Forms

**Approach**: Hybrid — React Hook Form + Zod for client-side validation, Server Action for submission.

### Password Schema Requirements

```typescript
z.string()
  .min(8, 'Min 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
```

### File Upload Validation

- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5MB
- Validate extension AND MIME type

### Form Rules

- Show field-level errors below the field (red text + red border).
- Disable submit button during submission.
- Never clear the form on error — preserve user input.
- Use `useFormStatus` for pending states in Server Action forms.

---

## Utility Defaults

- **Default currency**: `GEL` for `formatCurrency`.
- **Date format**: `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })`.
