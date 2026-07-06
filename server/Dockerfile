# ─── Stage 1: Install dependencies ───
FROM node:20-alpine AS deps

WORKDIR /app

# openssl for Prisma; build-base+python3 so any native npm dep can compile under musl.
# (sharp ships a prebuilt musl libvips binary — no compile needed — but keep the toolchain
# available for other native deps. florca's CPU is sub-x86-64-v2; the musl sharp prebuilt
# runs there where the glibc one refuses. See migration spec.)
RUN apk add --no-cache openssl python3 make g++

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Force development to install devDependencies (typescript, tsc-alias, prisma)
# Coolify injects NODE_ENV=production as a build ARG which causes npm ci to skip devDeps
ENV NODE_ENV=development
RUN npm ci || npm ci
RUN npx prisma generate

# ─── Stage 2: Build TypeScript ───
FROM deps AS build

COPY . .
RUN npm run build

# ─── Stage 3: Production runner ───
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

RUN npm install -g pm2

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/prisma ./prisma
COPY package.json ./
COPY ecosystem.config.cjs ./

# Copy non-TS data files that tsc doesn't include in dist/
COPY --from=build /app/src/modules/filters/data ./dist/modules/filters/data

RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && pm2-runtime start ecosystem.config.cjs"]
