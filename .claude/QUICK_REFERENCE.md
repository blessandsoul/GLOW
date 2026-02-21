# Quick Reference for AI Assistants

**Read this first, then dive into specific rule files as needed.**

---

If project is empty start server/client commands

## How Rules Are Organized

Rules are scoped by directory:

| Scope | Path | Applies To |
|-------|------|------------|
| **Global** | `.claude/rules/global/` | Entire workspace (server + client) |
| **Server** | `.claude/rules/server/` | Backend (API server) only |
| **Client** | `.claude/rules/client/` | Frontend (Next.js App Router) only |

Always check which scope you're working in before writing code.

---

## Global Rules (Always Apply)

### Safe Editing
- Keep changes **small and focused**
- Preserve existing function signatures and exports unless explicitly asked
- Extend modules, don't rewrite
- Add `// TODO:` comments for ambiguities or follow-ups
- Never leave half-implemented features without explanation
- No noisy debug logs; mark temporary ones with `// TODO: remove debug log`
- Never delete or radically restructure large parts of the codebase
- Preserve existing behavior for critical flows (auth, payments, core business logic)

See: `global/ai-edit-safety.md`

---

## Server Rules Summary

### Architecture
```
Request -> Routes -> Controller -> Service -> Repository -> Database
```

- **Controllers**: Validate input (Zod), call services, return responses, throw typed errors. NO business logic, NO direct DB access.
- **Services**: All business logic. Throw typed `AppError` instances. NO HTTP concepts (request/reply). Return data or throw.
- **Repositories**: Database queries only.

### Module Structure
```
src/modules/<domain>/
  <domain>.routes.ts
  <domain>.controller.ts
  <domain>.service.ts
  <domain>.repo.ts
  <domain>.schemas.ts
  <domain>.types.ts (optional)
```

### API Response Format (Mandatory)
```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```
- Use `successResponse()` / `paginatedResponse()` helpers
- Throw typed errors only (`AppError` subclasses)
- Global error handler formats all errors

### Database
- Schema changes via Prisma migrations only
- Development: `prisma:reset` freely; Production: `prisma:migrate deploy` only
- Tables: `snake_case` plural; Columns: `snake_case`; FKs: `<table_singular>_id`
- All main tables need: `id`, `created_at`, `updated_at`

### Code Style
- TypeScript strict mode, type all params and returns
- `async/await` over `.then()`
- Named exports (exception: `app.ts`)
- Use `logger` from `src/libs/`, never `console.log`
- Detect package manager from lockfile

See: `server/general-rules.md`, `server/project-conventions.md`, `server/response-handling.md`, `server/pagination.md`, `server/db-and-migrations.md`, `server/migrations.md`

---

## Client Rules Summary

### Architecture
- Next.js App Router with Server Components by default
- Client Components only when interactivity is needed (`'use client'`)
- Feature modules under `src/features/<domain>/`

### Module Structure
```
src/features/<domain>/
  components/
  hooks/
  services/
  store/ (Redux, if needed)
  types/
  actions/ (Server Actions, optional)
```

### State Management
| State Type | Tool |
|------------|------|
| Server data (SSR) | Server Components |
| Server data (client) | React Query |
| Global client state | Redux (auth, user) |
| Local state | useState / useReducer |
| URL state | useSearchParams |

### Component Rules
- Max 250 lines per component
- Max 5 props (use object if more)
- Max 3 levels of JSX nesting
- Use `cn()` for conditional classes
- Use Next.js `Image` and `Link` components
- Follow import order: React/Next -> third-party -> UI -> local -> hooks -> services -> types -> utils

### Styling
- Tailwind CSS only, no inline styles
- Use CSS variable-based color tokens (e.g., `bg-primary`, `text-foreground`)
- Never hardcode hex/rgb values
- Pair backgrounds with foregrounds for contrast
- See color system and design aesthetics rules for full details

### Forms
- React Hook Form + Zod for complex forms
- Server Actions for simple forms
- Always validate client-side AND server-side

### Security
- Never inject raw HTML without sanitization (use DOMPurify)
- Never prefix secrets with `NEXT_PUBLIC_`
- Validate all inputs, sanitize all outputs
- Secure external links with `rel="noopener noreferrer"`

See: `client/01-project-structure.md` through `client/11-microcopy-and-tone.md`

---

## When Implementing Features

1. **Identify scope** - Are you working in server, client, or both?
2. **Read relevant rules** - Check the scoped rule files for that directory
3. **Summarize** what needs to be done
4. **List** files to create/modify
5. **Provide** complete code for each file
6. **Mention** migrations, env variables, or dependencies needed
7. **State assumptions** if unsure

---

## Full Documentation Index

### Global
- `global/ai-edit-safety.md` - Safe editing guidelines

### Server
- `server/general-rules.md` - Architecture and stack
- `server/project-conventions.md` - File structure and coding style
- `server/response-handling.md` - Response contract
- `server/pagination.md` - Pagination contract
- `server/db-and-migrations.md` - Database standards
- `server/migrations.md` - Migration quick rules

### Client
- `client/01-project-structure.md` - File naming and folder structure
- `client/02-component-patterns.md` - Server/Client components
- `client/03-typescript-rules.md` - TypeScript conventions
- `client/04-state-management.md` - State strategy
- `client/05-api-integration.md` - API calls and error handling
- `client/06-forms-validation.md` - Forms and validation
- `client/07-common-patterns.md` - Hooks, utilities, patterns
- `client/08-color-system.md` - Color tokens and theming
- `client/09-security-rules.md` - Frontend security
- `client/10-design-aesthetics.md` - UI design philosophy
- `client/11-microcopy-and-tone.md` - UX writing and tone

---

**Last Updated**: 2026-02-06
