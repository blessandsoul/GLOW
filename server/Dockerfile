# ─── Stage 1: Install dependencies ───
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Force development to install devDependencies (typescript, tsc-alias, prisma)
# Coolify injects NODE_ENV=production as a build ARG which causes npm ci to skip devDeps
ENV NODE_ENV=development
RUN npm ci
RUN npx prisma generate

# ─── Stage 2: Build TypeScript ───
FROM deps AS build

COPY . .
RUN npm run build

# ─── Stage 3: Production runner ───
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/prisma ./prisma
COPY package.json ./

RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
