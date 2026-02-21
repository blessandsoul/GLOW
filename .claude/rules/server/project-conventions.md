> **SCOPE**: These rules apply specifically to the **server** directory.

# Project Conventions

## Stack

| Technology | Purpose |
|------------|---------|
| Node.js 20+ LTS | Runtime |
| Fastify | HTTP framework (plugins, route prefixes, centralized error handling) |
| TypeScript (strict) | Language — always type parameters and return types |
| MySQL 8.0+ | Primary database |
| Prisma 6.x | ORM, migrations, schema source of truth |
| Redis | Caching (popular listings, lookups), rate limiting, background task signaling |
| Zod | Runtime validation and type inference |
| JWT (HS256/RS256) | Auth — minimal token payload (id, role), role-based access control |
| PM2 + Nginx | Production deployment (cluster mode) |
| Jest / Vitest | Testing — deterministic, mock external APIs |

## Package Manager

Detect from lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, else → npm.

## Folder Structure

```
src/
├── app.ts              # Fastify instance and plugin registration
├── server.ts           # listen() call only, no app logic
├── config/             # env, config, constants
├── libs/               # shared libraries (db, redis, logger, auth)
└── modules/<domain>/   # domain modules
    ├── <domain>.routes.ts
    ├── <domain>.controller.ts
    ├── <domain>.service.ts
    ├── <domain>.repo.ts
    ├── <domain>.schemas.ts
    └── <domain>.types.ts  (if needed)
```

New modules MUST follow `src/modules/<name>/` with the exact naming pattern above.

## API Routes

All routes prefixed with `/api/v1`. Grouped by domain: `/api/v1/<domain>/...`

Register routes as Fastify plugins in `<domain>.routes.ts`.

## Coding Style

- TypeScript `strict` mode ON
- `async/await` over `.then()`
- Named exports (except `src/app.ts` which default-exports the Fastify instance)
- Relative imports within a module (`./user.service`), aliased imports cross-module (`@modules/users/...`)
- Use `logger` from `src/libs/logger` — never `console.log`

## Layer Responsibilities

| Layer | MUST | MUST NOT |
|-------|------|----------|
| **Routes** | Register Fastify plugins, define HTTP method + path | Contain any logic |
| **Controllers** | Validate input (Zod), call services, return via `successResponse`/`paginatedResponse`, throw typed `AppError` | Business logic, direct DB access, manual error JSON, set HTTP status codes for errors |
| **Services** | All business logic, throw `AppError` subclasses, call repos for DB ops, be stateless | Touch Fastify (request/reply), format responses, return HTTP status codes |
| **Repositories** | Prisma queries, return raw data | Business logic, error formatting |

## Security

- Validate all inputs with Zod schemas
- Never interpolate raw values into SQL — always use Prisma query builder
- Rate limit public endpoints
- Avoid N+1 queries — prefer joins or batched queries
