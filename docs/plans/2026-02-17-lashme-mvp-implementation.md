# LashMe MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full MVP SaaS where beauty masters upload a photo and receive 4 AI-enhanced variants via fal.ai, with a credit-based freemium model (3 free on signup).

**Architecture:** Next.js 16 frontend (already scaffolded) + new Fastify backend. File storage via Cloudflare R2. AI processing via fal.ai FLUX img2img. Jobs processed via BullMQ queue. Polling from frontend every 2s to check job status.

**Tech Stack:** Next.js 16, Fastify, Prisma 6, MySQL, Redis, BullMQ, fal.ai SDK, @aws-sdk/client-s3 (R2-compatible), Tailwind CSS 4, shadcn/ui, React Query, Redux Toolkit, Zod, Lucide React

---

## Phase 1: Backend — Foundation

### Task 1: Scaffold Fastify Server

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`
- Create: `server/src/server.ts`
- Create: `server/src/app.ts`

**Step 1: Create server directory and package.json**

```bash
mkdir server && cd server
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install fastify @fastify/cors @fastify/multipart @fastify/jwt fastify-plugin
npm install @prisma/client prisma
npm install ioredis bullmq
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install @fal-ai/client
npm install zod bcryptjs uuid
npm install pino pino-pretty

npm install -D typescript ts-node @types/node @types/bcryptjs @types/uuid tsx nodemon
```

**Step 3: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create `server/.env.example`**

```env
DATABASE_URL="mysql://root:password@localhost:3306/lashme"
REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="change-me-access-secret-min-32-chars"
JWT_REFRESH_SECRET="change-me-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="lashme"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

FAL_KEY="your-fal-ai-key"

PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3001"
```

Copy to `server/.env` and fill in real values.

**Step 5: Create `server/src/config/env.ts`**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),
  FAL_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

**Step 6: Create `server/src/libs/logger.ts`**

```typescript
import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

**Step 7: Create `server/src/app.ts`**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { logger } from './libs/logger.js';

export async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({ logger });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  // Routes registered here in later tasks
  // await app.register(authRoutes, { prefix: '/api/v1' });

  return app;
}
```

**Step 8: Create `server/src/server.ts`**

```typescript
import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
```

**Step 9: Add scripts to `server/package.json`**

Add to the `scripts` section:
```json
{
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:migrate": "prisma migrate",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts"
  }
}
```

**Step 10: Run and verify server starts**

```bash
cd server
cp .env.example .env
# Fill in DATABASE_URL and other required values
npm run dev
```

Expected: `Server listening at http://0.0.0.0:3000`

**Step 11: Commit**

```bash
git add server/
git commit -m "feat: scaffold fastify server with config and logger"
```

---

### Task 2: Database Schema & Prisma Setup

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/libs/db.ts`

**Step 1: Initialize Prisma**

```bash
cd server
npx prisma init --datasource-provider mysql
```

**Step 2: Replace `server/prisma/schema.prisma` with:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  credits       Int      @default(3)
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  jobs         Job[]
  transactions CreditTransaction[]

  @@map("users")
}

model Job {
  id          String    @id @default(uuid())
  userId      String?   @map("user_id")
  status      JobStatus @default(PENDING)
  originalUrl String    @map("original_url") @db.Text
  results     Json?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status])
  @@map("jobs")
}

enum JobStatus {
  PENDING
  PROCESSING
  DONE
  FAILED
}

model CreditTransaction {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  delta     Int
  reason    String   @db.VarChar(64)
  jobId     String?  @map("job_id")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("credit_transactions")
}
```

**Step 3: Run migration**

```bash
cd server
npx prisma migrate dev --name init_schema
```

Expected: Migration created and applied. Tables `users`, `jobs`, `credit_transactions` created in DB.

**Step 4: Create `server/src/libs/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

**Step 5: Verify Prisma Studio**

```bash
cd server && npx prisma studio
```

Expected: Browser opens at http://localhost:5555 showing User, Job, CreditTransaction tables.

**Step 6: Commit**

```bash
git add server/prisma/ server/src/libs/db.ts
git commit -m "feat: add prisma schema with User, Job, CreditTransaction models"
```

---

### Task 3: Error Handling Infrastructure

**Files:**
- Create: `server/src/libs/errors.ts`
- Modify: `server/src/app.ts`

**Step 1: Create `server/src/libs/errors.ts`**

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(code, message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(code, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(code, message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_FAILED', message, 422);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super('INTERNAL_ERROR', message, 500);
  }
}
```

**Step 2: Create `server/src/libs/response.ts`**

```typescript
export function successResponse<T>(message: string, data: T) {
  return { success: true, message, data };
}

export function paginatedResponse<T>(
  message: string,
  items: T[],
  page: number,
  limit: number,
  totalItems: number,
) {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  };
}
```

**Step 3: Add global error handler to `server/src/app.ts`**

Add after the multipart register:

```typescript
import { AppError } from './libs/errors.js';
import { ZodError } from 'zod';

// In buildApp(), add:
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }

  if (error instanceof ZodError) {
    return reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
      },
    });
  }

  app.log.error(error);
  return reply.status(500).send({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});
```

**Step 4: Commit**

```bash
git add server/src/libs/errors.ts server/src/libs/response.ts server/src/app.ts
git commit -m "feat: add error classes and global error handler"
```

---

### Task 4: Auth Module

**Files:**
- Create: `server/src/modules/auth/auth.schemas.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/auth.routes.ts`
- Create: `server/src/libs/jwt.ts`
- Modify: `server/src/app.ts`

**Step 1: Create `server/src/libs/jwt.ts`**

```typescript
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  id: string;
  email: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
```

Add: `npm install jsonwebtoken && npm install -D @types/jsonwebtoken` in server dir.

**Step 2: Create `server/src/modules/auth/auth.schemas.ts`**

```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
```

**Step 3: Create `server/src/modules/auth/auth.service.ts`**

```typescript
import bcrypt from 'bcryptjs';
import { db } from '../../libs/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../libs/jwt.js';
import { ConflictError, UnauthorizedError } from '../../libs/errors.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email already in use', 'EMAIL_ALREADY_EXISTS');

    const hashed = await bcrypt.hash(input.password, 12);
    const user = await db.user.create({
      data: {
        email: input.email,
        password: hashed,
        credits: 3,
        transactions: {
          create: { delta: 3, reason: 'signup_bonus' },
        },
      },
      select: { id: true, email: true, credits: true, createdAt: true },
    });

    const payload = { id: user.id, email: user.email };
    return {
      user,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }

  async login(input: LoginInput) {
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    const payload = { id: user.id, email: user.email };
    return {
      user: { id: user.id, email: user.email, credits: user.credits },
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }

  async refresh(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await db.user.findUnique({ where: { id: payload.id } });
      if (!user) throw new UnauthorizedError('User not found');

      const newPayload = { id: user.id, email: user.email };
      return {
        accessToken: signAccessToken(newPayload),
        refreshToken: signRefreshToken(newPayload),
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
  }

  async getMe(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, credits: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  }
}

export const authService = new AuthService();
```

**Step 4: Create `server/src/libs/auth-middleware.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './jwt.js';
import { UnauthorizedError } from './errors.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedError();

  try {
    const payload = verifyAccessToken(auth.slice(7));
    (request as FastifyRequest & { userId: string }).userId = payload.id;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

**Step 5: Create `server/src/modules/auth/auth.controller.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schemas.js';
import { authService } from './auth.service.js';
import { successResponse } from '../../libs/response.js';
import { requireAuth } from '../../libs/auth-middleware.js';

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const input = RegisterSchema.parse(request.body);
  const result = await authService.register(input);
  return reply.status(201).send(successResponse('Registration successful', result));
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const input = LoginSchema.parse(request.body);
  const result = await authService.login(input);
  return reply.send(successResponse('Login successful', result));
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = RefreshSchema.parse(request.body);
  const tokens = await authService.refresh(refreshToken);
  return reply.send(successResponse('Token refreshed', tokens));
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  const userId = (request as FastifyRequest & { userId: string }).userId;
  const user = await authService.getMe(userId);
  return reply.send(successResponse('User retrieved', user));
}
```

**Step 6: Create `server/src/modules/auth/auth.routes.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { registerController, loginController, refreshController, meController } from './auth.controller.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', registerController);
  app.post('/auth/login', loginController);
  app.post('/auth/refresh', refreshController);
  app.get('/auth/me', meController);
}
```

**Step 7: Register in `server/src/app.ts`**

```typescript
import { authRoutes } from './modules/auth/auth.routes.js';
// In buildApp():
await app.register(authRoutes, { prefix: '/api/v1' });
```

**Step 8: Test auth endpoints manually**

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","firstName":"Test","lastName":"User"}'

# Expected: 201 with user + tokens + credits: 3

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'
```

**Step 9: Commit**

```bash
git add server/src/modules/auth/ server/src/libs/jwt.ts server/src/libs/auth-middleware.ts
git commit -m "feat: add auth module (register, login, refresh, me)"
```

---

### Task 5: Storage (Cloudflare R2)

**Files:**
- Create: `server/src/libs/storage.ts`

**Step 1: Create `server/src/libs/storage.ts`**

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(buffer: Buffer, mimeType: string, folder: 'originals' | 'results'): Promise<string> {
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
```

**Step 2: Commit**

```bash
git add server/src/libs/storage.ts
git commit -m "feat: add R2 storage helper"
```

---

### Task 6: Upload Module

**Files:**
- Create: `server/src/modules/upload/upload.controller.ts`
- Create: `server/src/modules/upload/upload.routes.ts`
- Modify: `server/src/app.ts`

**Step 1: Create `server/src/modules/upload/upload.controller.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { uploadToR2 } from '../../libs/storage.js';
import { db } from '../../libs/db.js';
import { BadRequestError } from '../../libs/errors.js';
import { successResponse } from '../../libs/response.js';
import { verifyAccessToken } from '../../libs/jwt.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadController(request: FastifyRequest, reply: FastifyReply) {
  // Optional auth — get userId if token present
  let userId: string | null = null;
  const auth = request.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(auth.slice(7));
      userId = payload.id;
    } catch { /* anonymous upload */ }
  }

  const data = await request.file();
  if (!data) throw new BadRequestError('No file uploaded');

  if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
    throw new BadRequestError('File must be JPEG, PNG, or WebP', 'INVALID_FILE_TYPE');
  }

  const buffer = await data.toBuffer();
  if (buffer.length > MAX_FILE_SIZE) {
    throw new BadRequestError('File too large. Max 10MB.', 'FILE_TOO_LARGE');
  }

  const originalUrl = await uploadToR2(buffer, data.mimetype, 'originals');

  const job = await db.job.create({
    data: { userId, originalUrl, status: 'PENDING' },
    select: { id: true, status: true, originalUrl: true, createdAt: true },
  });

  return reply.status(201).send(successResponse('Upload successful', job));
}
```

**Step 2: Create `server/src/modules/upload/upload.routes.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { uploadController } from './upload.controller.js';

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/upload', uploadController);
}
```

**Step 3: Register in `server/src/app.ts`**

```typescript
import { uploadRoutes } from './modules/upload/upload.routes.js';
await app.register(uploadRoutes, { prefix: '/api/v1' });
```

**Step 4: Test upload**

```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@/path/to/test-photo.jpg"
# Expected: 201 with job id and status: PENDING
```

**Step 5: Commit**

```bash
git add server/src/modules/upload/
git commit -m "feat: add upload module — stores photo to R2, creates job"
```

---

### Task 7: AI Processing Queue

**Files:**
- Create: `server/src/libs/queue.ts`
- Create: `server/src/modules/ai/ai.worker.ts`
- Modify: `server/src/server.ts`

**Step 1: Create `server/src/libs/queue.ts`**

```typescript
import { Queue } from 'bullmq';
import { env } from '../config/env.js';

export const imageQueue = new Queue('image-processing', {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export interface ImageJobData {
  jobId: string;
  originalUrl: string;
}
```

**Step 2: Create `server/src/modules/ai/ai.worker.ts`**

```typescript
import { Worker } from 'bullmq';
import { fal } from '@fal-ai/client';
import { db } from '../../libs/db.js';
import { uploadToR2 } from '../../libs/storage.js';
import { env } from '../../config/env.js';
import { logger } from '../../libs/logger.js';
import type { ImageJobData } from '../../libs/queue.js';

fal.config({ credentials: env.FAL_KEY });

const BEAUTY_PROMPT = `professional beauty photography, perfect studio lighting,
clean white neutral background, sharp focus on lash work nail art brow work,
high resolution, commercial quality, Instagram-ready, soft bokeh background,
warm professional lighting, macro photography, detailed close-up`;

export function createImageWorker() {
  return new Worker<ImageJobData>(
    'image-processing',
    async (job) => {
      const { jobId, originalUrl } = job.data;
      logger.info({ jobId }, 'Processing image job');

      await db.job.update({ where: { id: jobId }, data: { status: 'PROCESSING' } });

      try {
        const result = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
          input: {
            image_url: originalUrl,
            prompt: BEAUTY_PROMPT,
            strength: 0.45,
            num_images: 4,
            image_size: 'portrait_4_3',
          },
        }) as { images: Array<{ url: string; content_type: string }> };

        // Download and re-upload to our R2 (don't expose fal.ai URLs)
        const resultUrls: string[] = [];
        for (const img of result.images) {
          const res = await fetch(img.url);
          const buffer = Buffer.from(await res.arrayBuffer());
          const url = await uploadToR2(buffer, img.content_type, 'results');
          resultUrls.push(url);
        }

        await db.job.update({
          where: { id: jobId },
          data: { status: 'DONE', results: resultUrls },
        });

        logger.info({ jobId, count: resultUrls.length }, 'Job completed');
      } catch (err) {
        logger.error({ jobId, err }, 'Job failed');
        await db.job.update({ where: { id: jobId }, data: { status: 'FAILED' } });
        throw err;
      }
    },
    { connection: { url: env.REDIS_URL }, concurrency: 3 },
  );
}
```

**Step 3: Trigger queue from upload controller**

In `server/src/modules/upload/upload.controller.ts`, after job creation:

```typescript
import { imageQueue } from '../../libs/queue.js';

// After job creation:
await imageQueue.add('process', { jobId: job.id, originalUrl });
```

**Step 4: Start worker in `server/src/server.ts`**

```typescript
import { createImageWorker } from './modules/ai/ai.worker.js';

// After app.listen():
const worker = createImageWorker();
worker.on('failed', (job, err) => {
  app.log.error({ jobId: job?.data.jobId, err }, 'Worker job failed');
});
```

**Step 5: Commit**

```bash
git add server/src/libs/queue.ts server/src/modules/ai/
git commit -m "feat: add BullMQ queue and fal.ai image processing worker"
```

---

### Task 8: Jobs Module

**Files:**
- Create: `server/src/modules/jobs/jobs.service.ts`
- Create: `server/src/modules/jobs/jobs.controller.ts`
- Create: `server/src/modules/jobs/jobs.routes.ts`
- Modify: `server/src/app.ts`

**Step 1: Create `server/src/modules/jobs/jobs.service.ts`**

```typescript
import { db } from '../../libs/db.js';
import { NotFoundError, ForbiddenError } from '../../libs/errors.js';

export class JobsService {
  async getJob(jobId: string, userId: string | null) {
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job not found', 'JOB_NOT_FOUND');

    // Anonymous jobs: anyone can check status
    // User jobs: only owner can access
    if (job.userId && userId && job.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return job;
  }

  async getUserJobs(userId: string, page: number, limit: number) {
    const [items, totalItems] = await Promise.all([
      db.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, status: true, originalUrl: true, results: true, createdAt: true },
      }),
      db.job.count({ where: { userId } }),
    ]);

    return { items, totalItems };
  }
}

export const jobsService = new JobsService();
```

**Step 2: Create `server/src/modules/jobs/jobs.controller.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { jobsService } from './jobs.service.js';
import { successResponse, paginatedResponse } from '../../libs/response.js';
import { requireAuth } from '../../libs/auth-middleware.js';

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function getJobController(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  // Optional auth
  let userId: string | null = null;
  const auth = request.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const { verifyAccessToken } = await import('../../libs/jwt.js');
      const payload = verifyAccessToken(auth.slice(7));
      userId = payload.id;
    } catch { /* ok */ }
  }

  const job = await jobsService.getJob(request.params.id, userId);
  return reply.send(successResponse('Job retrieved', job));
}

export async function getUserJobsController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  const userId = (request as FastifyRequest & { userId: string }).userId;
  const { page, limit } = PaginationSchema.parse(request.query);
  const { items, totalItems } = await jobsService.getUserJobs(userId, page, limit);
  return reply.send(paginatedResponse('Jobs retrieved', items, page, limit, totalItems));
}
```

**Step 3: Create `server/src/modules/jobs/jobs.routes.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { getJobController, getUserJobsController } from './jobs.controller.js';

export async function jobsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/jobs/:id', getJobController);
  app.get('/jobs', getUserJobsController);
}
```

**Step 4: Register in `server/src/app.ts`**

```typescript
import { jobsRoutes } from './modules/jobs/jobs.routes.js';
await app.register(jobsRoutes, { prefix: '/api/v1' });
```

**Step 5: Commit**

```bash
git add server/src/modules/jobs/
git commit -m "feat: add jobs module (get status, user history)"
```

---

### Task 9: Credits Module

**Files:**
- Create: `server/src/modules/credits/credits.service.ts`
- Create: `server/src/modules/credits/credits.controller.ts`
- Create: `server/src/modules/credits/credits.routes.ts`
- Modify: `server/src/app.ts`

**Step 1: Create `server/src/modules/credits/credits.service.ts`**

```typescript
import { db } from '../../libs/db.js';
import { BadRequestError, NotFoundError } from '../../libs/errors.js';

export class CreditsService {
  async getBalance(userId: string): Promise<{ credits: number }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return { credits: user.credits };
  }

  async useCredit(userId: string, jobId: string): Promise<{ credits: number }> {
    const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!user) throw new NotFoundError('User not found');
    if (user.credits < 1) throw new BadRequestError('Insufficient credits', 'INSUFFICIENT_CREDITS');

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 1 },
        transactions: {
          create: { delta: -1, reason: 'download', jobId },
        },
      },
      select: { credits: true },
    });

    return { credits: updated.credits };
  }
}

export const creditsService = new CreditsService();
```

**Step 2: Create `server/src/modules/credits/credits.controller.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { creditsService } from './credits.service.js';
import { successResponse } from '../../libs/response.js';
import { requireAuth } from '../../libs/auth-middleware.js';

const UseCreditSchema = z.object({ jobId: z.string().uuid() });

export async function getBalanceController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  const userId = (request as FastifyRequest & { userId: string }).userId;
  const balance = await creditsService.getBalance(userId);
  return reply.send(successResponse('Balance retrieved', balance));
}

export async function useCreditController(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  const userId = (request as FastifyRequest & { userId: string }).userId;
  const { jobId } = UseCreditSchema.parse(request.body);
  const result = await creditsService.useCredit(userId, jobId);
  return reply.send(successResponse('Credit used', result));
}
```

**Step 3: Create `server/src/modules/credits/credits.routes.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { getBalanceController, useCreditController } from './credits.controller.js';

export async function creditsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/credits', getBalanceController);
  app.post('/credits/use', useCreditController);
}
```

**Step 4: Register and commit**

```typescript
import { creditsRoutes } from './modules/credits/credits.routes.js';
await app.register(creditsRoutes, { prefix: '/api/v1' });
```

```bash
git add server/src/modules/credits/
git commit -m "feat: add credits module (balance, use credit)"
```

---

## Phase 2: Frontend

### Task 10: Update Design System (Luxury Beauty Palette)

**Files:**
- Modify: `client/src/app/globals.css`

**Step 1: Replace CSS variables in globals.css**

Find the `:root` block and update the brand/color variables:

```css
:root {
  /* Luxury Beauty palette */
  --background: 30 15% 97%;
  --foreground: 340 15% 15%;
  --card: 0 0% 100%;
  --card-foreground: 340 15% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 340 15% 15%;
  --primary: 340 70% 55%;
  --primary-foreground: 0 0% 100%;
  --secondary: 340 20% 95%;
  --secondary-foreground: 340 15% 15%;
  --muted: 340 20% 95%;
  --muted-foreground: 340 15% 50%;
  --accent: 35 80% 65%;
  --accent-foreground: 30 15% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 100%;
  --border: 340 20% 88%;
  --input: 340 20% 88%;
  --ring: 340 70% 55%;
  --radius: 0.75rem;
  --brand-primary: 340 70% 55%;
  --brand-secondary: 280 30% 45%;
  --brand-accent: 35 80% 65%;
}

.dark {
  --background: 280 25% 8%;
  --foreground: 30 15% 95%;
  --card: 280 20% 12%;
  --card-foreground: 30 15% 95%;
  --primary: 340 60% 65%;
  --primary-foreground: 280 25% 8%;
  --secondary: 280 15% 18%;
  --secondary-foreground: 30 15% 95%;
  --muted: 280 15% 18%;
  --muted-foreground: 280 10% 60%;
  --accent: 35 70% 60%;
  --accent-foreground: 280 25% 8%;
  --border: 280 15% 22%;
  --input: 280 15% 22%;
  --ring: 340 60% 65%;
}
```

**Step 2: Commit**

```bash
git add client/src/app/globals.css
git commit -m "feat: apply luxury beauty color palette"
```

---

### Task 11: Update API Endpoints & Routes Constants

**Files:**
- Modify: `client/src/lib/constants/api-endpoints.ts`
- Modify: `client/src/lib/constants/routes.ts`

**Step 1: Add new endpoints to `api-endpoints.ts`**

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  UPLOAD: '/upload',
  JOBS: {
    GET: (id: string) => `/jobs/${id}`,
    LIST: '/jobs',
  },
  CREDITS: {
    BALANCE: '/credits',
    USE: '/credits/use',
  },
} as const;
```

**Step 2: Add new routes to `routes.ts`**

```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DASHBOARD_CREDITS: '/dashboard/credits',
} as const;
```

**Step 3: Commit**

```bash
git add client/src/lib/constants/
git commit -m "feat: add upload, jobs, credits endpoints and routes"
```

---

### Task 12: Feature — Upload & Jobs Types + Services

**Files:**
- Create: `client/src/features/jobs/types/job.types.ts`
- Create: `client/src/features/jobs/services/job.service.ts`
- Create: `client/src/features/credits/types/credits.types.ts`
- Create: `client/src/features/credits/services/credits.service.ts`

**Step 1: Create `client/src/features/jobs/types/job.types.ts`**

```typescript
export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface Job {
  id: string;
  userId: string | null;
  status: JobStatus;
  originalUrl: string;
  results: string[] | null;
  createdAt: string;
}
```

**Step 2: Create `client/src/features/jobs/services/job.service.ts`**

```typescript
import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Job } from '../types/job.types';

class JobService {
  async uploadPhoto(file: File): Promise<Job> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<ApiResponse<Job>>(API_ENDPOINTS.UPLOAD, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  }

  async getJob(id: string): Promise<Job> {
    const res = await apiClient.get<ApiResponse<Job>>(API_ENDPOINTS.JOBS.GET(id));
    return res.data.data;
  }

  async getUserJobs(page = 1, limit = 10): Promise<PaginatedApiResponse<Job>['data']> {
    const res = await apiClient.get<PaginatedApiResponse<Job>>(API_ENDPOINTS.JOBS.LIST, {
      params: { page, limit },
    });
    return res.data.data;
  }
}

export const jobService = new JobService();
```

**Step 3: Create `client/src/features/credits/types/credits.types.ts`**

```typescript
export interface CreditBalance {
  credits: number;
}
```

**Step 4: Create `client/src/features/credits/services/credits.service.ts`**

```typescript
import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { CreditBalance } from '../types/credits.types';

class CreditsService {
  async getBalance(): Promise<CreditBalance> {
    const res = await apiClient.get<ApiResponse<CreditBalance>>(API_ENDPOINTS.CREDITS.BALANCE);
    return res.data.data;
  }

  async useCredit(jobId: string): Promise<CreditBalance> {
    const res = await apiClient.post<ApiResponse<CreditBalance>>(API_ENDPOINTS.CREDITS.USE, { jobId });
    return res.data.data;
  }
}

export const creditsService = new CreditsService();
```

**Step 5: Commit**

```bash
git add client/src/features/jobs/ client/src/features/credits/
git commit -m "feat: add job and credits types and services"
```

---

### Task 13: Upload Feature Component

**Files:**
- Create: `client/src/features/upload/components/UploadZone.tsx`
- Create: `client/src/features/upload/hooks/useUpload.ts`

**Step 1: Create `client/src/features/upload/hooks/useUpload.ts`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { jobService } from '@/features/jobs/services/job.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { Job } from '@/features/jobs/types/job.types';
import { toast } from 'sonner';

interface UseUploadReturn {
  job: Job | null;
  isUploading: boolean;
  uploadFile: (file: File) => void;
}

export function useUpload(): UseUploadReturn {
  const [job, setJob] = useState<Job | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => jobService.uploadPhoto(file),
    onSuccess: (data) => setJob(data),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const uploadFile = useCallback((file: File) => {
    mutation.mutate(file);
  }, [mutation]);

  return { job, isUploading: mutation.isPending, uploadFile };
}
```

**Step 2: Create `client/src/features/upload/components/UploadZone.tsx`**

```typescript
'use client';

import { useCallback, useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Only JPEG, PNG, or WebP allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File too large. Max 10MB.');
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed',
        'min-h-64 cursor-pointer transition-all duration-300',
        'border-border/50 bg-card',
        isDragging
          ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]'
          : 'hover:border-primary/60 hover:bg-muted/50 hover:shadow-md hover:-translate-y-0.5',
        isLoading && 'pointer-events-none opacity-60',
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={isLoading}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          {isLoading
            ? <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            : <Upload className="h-8 w-8 text-primary" />
          }
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            {isLoading ? 'Загружаем...' : 'Загрузи фото работы'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPEG, PNG или WebP — до 10 МБ
          </p>
        </div>
      </div>
    </label>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/features/upload/
git commit -m "feat: add UploadZone component with drag and drop"
```

---

### Task 14: Job Results Component (Polling + Grid)

**Files:**
- Create: `client/src/features/jobs/hooks/useJobPolling.ts`
- Create: `client/src/features/jobs/components/ResultsGrid.tsx`

**Step 1: Create `client/src/features/jobs/hooks/useJobPolling.ts`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services/job.service';
import type { Job } from '../types/job.types';

export function useJobPolling(jobId: string | null): { job: Job | null; isPolling: boolean } {
  const { data, isFetching } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'DONE' || status === 'FAILED') return false;
      return 2000; // poll every 2s
    },
  });

  return {
    job: data ?? null,
    isPolling: isFetching && data?.status !== 'DONE' && data?.status !== 'FAILED',
  };
}
```

**Step 2: Create `client/src/features/jobs/components/ResultsGrid.tsx`**

```typescript
'use client';

import Image from 'next/image';
import { Download, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import type { Job } from '../types/job.types';

interface ResultsGridProps {
  job: Job;
  isAuthenticated: boolean;
  onDownload: (url: string, jobId: string) => void;
}

export function ResultsGrid({ job, isAuthenticated, onDownload }: ResultsGridProps): React.ReactElement {
  if (job.status === 'PENDING' || job.status === 'PROCESSING') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          <span>AI улучшает твоё фото...</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (job.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">Что-то пошло не так. Попробуй ещё раз.</p>
      </div>
    );
  }

  const results = job.results ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Выбери лучший вариант</p>
      <div className="grid grid-cols-2 gap-3">
        {results.map((url, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-border/50">
            <div className={cn('relative aspect-[3/4]', !isAuthenticated && 'blur-sm')}>
              <Image
                src={url}
                alt={`Вариант ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onDownload(url, job.id)}
              >
                <Download className="mr-1 h-3 w-3" />
                Скачать
              </Button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <p className="text-center text-xs font-medium text-foreground px-3">
                  Зарегистрируйся<br />чтобы скачать
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/features/jobs/
git commit -m "feat: add job polling hook and results grid component"
```

---

### Task 15: Homepage — The Main Experience

**Files:**
- Modify: `client/src/app/page.tsx`
- Create: `client/src/features/upload/components/UploadSection.tsx`

**Step 1: Create `client/src/features/upload/components/UploadSection.tsx`** (client component)

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { UploadZone } from './UploadZone';
import { ResultsGrid } from '@/features/jobs/components/ResultsGrid';
import { useUpload } from '../hooks/useUpload';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { creditsService } from '@/features/credits/services/credits.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { RootState } from '@/store';

export function UploadSection(): React.ReactElement {
  const { job: uploadedJob, isUploading, uploadFile } = useUpload();
  const { job } = useJobPolling(uploadedJob?.id ?? null);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const handleDownload = useCallback(async (url: string, jobId: string) => {
    try {
      await creditsService.useCredit(jobId);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lashme-${Date.now()}.jpg`;
      a.click();
      toast.success('Фото скачано! -1 кредит');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, []);

  const currentJob = job ?? uploadedJob;

  return (
    <div className="w-full max-w-2xl space-y-6">
      {!currentJob && (
        <UploadZone onFileSelect={uploadFile} isLoading={isUploading} />
      )}
      {currentJob && (
        <>
          <ResultsGrid
            job={currentJob}
            isAuthenticated={isAuthenticated}
            onDownload={handleDownload}
          />
          {currentJob.status === 'DONE' && (
            <button
              onClick={() => window.location.reload()}
              className="w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Загрузить другое фото
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 2: Replace `client/src/app/page.tsx`**

```typescript
import Link from 'next/link';
import { Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadSection } from '@/features/upload/components/UploadSection';

export default function HomePage(): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-semibold text-foreground">LashMe</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Начать бесплатно</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero + Upload */}
      <main className="flex flex-1 flex-col items-center px-4 py-16 gap-10">
        <div className="text-center max-w-lg">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            3 фото бесплатно при регистрации
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground text-wrap-balance leading-tight mb-4">
            Продающее фото<br />за 30 секунд
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Загрузи фото своей работы — AI улучшит свет, фон и качество.<br />
            Идеально для лешей, ногтей и бровей.
          </p>
        </div>

        <UploadSection />

        {/* How it works */}
        <section className="w-full max-w-2xl">
          <h2 className="text-center text-xl font-semibold text-foreground mb-8">
            Как это работает
          </h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { step: '1', text: 'Загрузи фото работы' },
              { step: '2', text: 'AI улучшает за 30 сек' },
              { step: '3', text: 'Скачай 4 варианта' },
            ].map(({ step, text }) => (
              <div key={step} className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {step}
                </div>
                <p className="text-sm text-foreground font-medium">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="w-full max-w-2xl">
          <h2 className="text-center text-xl font-semibold text-foreground mb-8">
            Цены
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Старт', credits: 3, price: 'Бесплатно', desc: 'При регистрации' },
              { name: 'Пак 10', credits: 10, price: '$5', desc: '$0.50 за фото' },
              { name: 'Пак 50', credits: 50, price: '$18', desc: '$0.36 за фото' },
            ].map(({ name, credits, price, desc }) => (
              <div key={name} className="rounded-xl border border-border/50 bg-card p-5 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <p className="text-sm text-muted-foreground">{name}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{price}</p>
                <p className="mt-1 text-sm font-medium text-primary">{credits} кредитов</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            1 кредит = 1 скачивание. Оплата скоро.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        © 2026 LashMe
      </footer>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/app/page.tsx client/src/features/upload/components/UploadSection.tsx
git commit -m "feat: build homepage with upload zone, results, pricing"
```

---

### Task 16: Update Auth to Include Credits in Redux State

**Files:**
- Modify: `client/src/features/auth/types/auth.types.ts`
- Modify: `client/src/store/authSlice.ts` (or wherever it lives)

**Step 1: Add `credits` to IUser in `client/src/features/auth/types/auth.types.ts`**

Find `IUser` interface and add:
```typescript
credits: number;
```

**Step 2: In auth slice, when `setCredentials` is called with a user, ensure credits are stored.**

This allows the header/dashboard to show credit balance from Redux without extra API call.

**Step 3: Commit**

```bash
git add client/src/features/auth/
git commit -m "feat: add credits to user type and auth state"
```

---

### Task 17: Dashboard — Job History & Credits

**Files:**
- Modify: `client/src/app/dashboard/page.tsx`
- Create: `client/src/app/dashboard/credits/page.tsx`
- Create: `client/src/features/jobs/components/JobHistoryList.tsx`

**Step 1: Create `client/src/features/jobs/components/JobHistoryList.tsx`**

```typescript
'use client';

import Image from 'next/image';
import { Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services/job.service';
import { Skeleton } from '@/components/ui/skeleton';
import type { Job, JobStatus } from '../types/job.types';

function StatusBadge({ status }: { status: JobStatus }): React.ReactElement {
  const map: Record<JobStatus, { icon: React.ReactNode; label: string; class: string }> = {
    PENDING: { icon: <Clock className="h-3 w-3" />, label: 'Ожидание', class: 'text-muted-foreground' },
    PROCESSING: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Обработка', class: 'text-primary' },
    DONE: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Готово', class: 'text-green-600' },
    FAILED: { icon: <AlertCircle className="h-3 w-3" />, label: 'Ошибка', class: 'text-destructive' },
  };
  const { icon, label, class: cls } = map[status];
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${cls}`}>
      {icon}{label}
    </span>
  );
}

export function JobHistoryList(): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.getUserJobs(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const jobs = data?.items ?? [];

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground">Нет обработанных фото.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Загрузи первое фото на главной странице.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job: Job) => (
        <div key={job.id} className="flex gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
            <Image src={job.originalUrl} alt="Original" fill className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <StatusBadge status={job.status} />
            <p className="text-xs text-muted-foreground">
              {new Date(job.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {job.results && job.results.length > 0 && (
            <div className="flex gap-1">
              {job.results.slice(0, 2).map((url, i) => (
                <div key={i} className="relative h-16 w-12 overflow-hidden rounded-lg">
                  <Image src={url} alt={`Result ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Replace `client/src/app/dashboard/page.tsx`**

```typescript
import { Gem, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { JobHistoryList } from '@/features/jobs/components/JobHistoryList';

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Мои фото</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/credits">
            <Gem className="mr-2 h-4 w-4 text-primary" />
            Кредиты
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-4 w-4" />
          <h2 className="text-sm font-medium">История обработок</h2>
        </div>
        <JobHistoryList />
      </div>
    </div>
  );
}
```

**Step 3: Create `client/src/app/dashboard/credits/page.tsx`**

```typescript
import { Gem, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PACKS = [
  { name: 'Пак 10', credits: 10, price: '$5', pricePerCredit: '$0.50' },
  { name: 'Пак 50', credits: 50, price: '$18', pricePerCredit: '$0.36', popular: true },
  { name: 'Пак 100', credits: 100, price: '$30', pricePerCredit: '$0.30' },
];

export default function CreditsPage(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
          <Gem className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Купить кредиты</h1>
        <p className="text-muted-foreground">1 кредит = 1 скачивание высококачественного фото</p>
      </div>

      <div className="grid gap-4">
        {PACKS.map(({ name, credits, price, pricePerCredit, popular }) => (
          <div
            key={name}
            className={`relative rounded-xl border p-6 flex items-center justify-between shadow-sm transition-all hover:shadow-md ${
              popular ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
            }`}
          >
            {popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Популярный
              </span>
            )}
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{credits} кредитов · {pricePerCredit}/кредит</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">{price}</span>
              <Button size="sm" disabled>
                Скоро
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Оплата через Stripe появится в ближайшее время
      </p>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add client/src/app/dashboard/ client/src/features/jobs/components/JobHistoryList.tsx
git commit -m "feat: add dashboard with job history and credits page"
```

---

## Phase 3: Integration & Verification

### Task 18: Update page.tsx Subtitle

**Files:**
- Modify: `client/src/app/page.tsx` (line 12)

The homepage subtitle still says "Your premium furniture shopping experience starts here." — update to match the product.

This was already handled in Task 15 where we replaced the full page.tsx — verify it's correct after that task.

---

### Task 19: End-to-End Verification

**Step 1: Start MySQL and Redis (if local)**

```bash
# MySQL (or use Docker)
docker run -d --name lashme-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=lashme -p 3306:3306 mysql:8

# Redis
docker run -d --name lashme-redis -p 6379:6379 redis:alpine
```

**Step 2: Run migrations**

```bash
cd server
npx prisma migrate deploy
```

**Step 3: Start backend**

```bash
cd server && npm run dev
# Verify: "Server listening at http://0.0.0.0:3000"
```

**Step 4: Start frontend**

```bash
cd client && npm run dev
# Verify: opens at http://localhost:3001
```

**Step 5: Test core flow**

1. Open http://localhost:3001
2. Drag a photo onto the upload zone → should show processing skeletons
3. After ~30s → 4 result images appear (blurred)
4. Click "Зарегистрируйся чтобы скачать" → register modal or redirect
5. Register → check user in DB: `credits = 3`
6. Log in → upload another photo → results visible without blur
7. Click "Скачать" → file downloads, credits drop from 3 to 2
8. Dashboard → job history shows both jobs

**Step 6: Verify colors**

Open the app — background should be warm cream (not pure white), buttons rose-pink, CTA gold-tinted.

---

## Key File Reference

| File | Purpose |
|---|---|
| `server/src/app.ts` | Fastify instance, plugin registration, error handler |
| `server/src/libs/errors.ts` | AppError subclasses |
| `server/src/libs/response.ts` | successResponse, paginatedResponse |
| `server/src/libs/jwt.ts` | Sign/verify JWT tokens |
| `server/src/libs/storage.ts` | R2 upload helper |
| `server/src/libs/queue.ts` | BullMQ queue definition |
| `server/src/modules/ai/ai.worker.ts` | fal.ai processing worker |
| `server/prisma/schema.prisma` | DB schema — User, Job, CreditTransaction |
| `client/src/app/page.tsx` | Homepage — hero, upload, pricing |
| `client/src/features/upload/components/UploadZone.tsx` | Drag & drop UI |
| `client/src/features/upload/components/UploadSection.tsx` | Upload + polling orchestration |
| `client/src/features/jobs/hooks/useJobPolling.ts` | React Query polling |
| `client/src/features/jobs/components/ResultsGrid.tsx` | 2×2 results with blur |
| `client/src/app/globals.css` | Luxury beauty color palette |
