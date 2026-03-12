# ─── Stage 1: Install dependencies ───
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: Build Next.js ───
FROM node:22-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_ID
ARG UNSPLASH_ACCESS_KEY
ARG PEXELS_API_KEY

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

# Fetch blog cover images before build
RUN if [ -n "$UNSPLASH_ACCESS_KEY" ] || [ -n "$PEXELS_API_KEY" ]; then \
      UNSPLASH_ACCESS_KEY=$UNSPLASH_ACCESS_KEY \
      PEXELS_API_KEY=$PEXELS_API_KEY \
      node scripts/fetch-covers.mjs; \
    fi

RUN npm run build

# ─── Stage 3: Production runner ───
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/content ./content

EXPOSE 3000

CMD ["node", "server.js"]
