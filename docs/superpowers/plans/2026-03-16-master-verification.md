# Master Verification System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a master verification system where masters submit ID + portfolio for admin approval, with optional Tier 2 badges (certified, hygiene, quality products, experienced, top rated). Only verified masters appear on the homepage featured section.

**Architecture:** Add `verificationStatus` and badge fields to `MasterProfile` via Prisma migration. New server endpoints for masters to request verification and upload documents, plus admin endpoints to review and approve/reject. Client gets a verification section in the dashboard profile page and a verification queue in admin panel. Featured masters filter gates on `verificationStatus = 'VERIFIED'`.

**Tech Stack:** Prisma (MySQL), Fastify, Zod, React Query, shadcn/ui, Tailwind CSS, Phosphor Icons

---

## File Structure

### Server — New/Modified Files

| File | Action | Responsibility |
|------|--------|----------------|
| `server/prisma/schema.prisma` | Modify | Add verification fields to MasterProfile |
| `server/src/modules/verification/verification.routes.ts` | Create | Master-facing verification endpoints |
| `server/src/modules/verification/verification.controller.ts` | Create | Parse input, call service, return responses |
| `server/src/modules/verification/verification.service.ts` | Create | Business logic for verification requests |
| `server/src/modules/verification/verification.repo.ts` | Create | Prisma queries for verification |
| `server/src/modules/verification/verification.schemas.ts` | Create | Zod schemas for verification input |
| `server/src/modules/verification/verification.types.ts` | Create | TypeScript types |
| `server/src/modules/admin/admin.routes.ts` | Modify | Add verification review endpoints |
| `server/src/modules/admin/admin.controller.ts` | Modify | Add verification review handlers |
| `server/src/modules/admin/admin.service.ts` | Modify | Add verification review logic |
| `server/src/modules/admin/admin.repo.ts` | Modify | Add verification queries |
| `server/src/modules/admin/admin.schemas.ts` | Modify | Add verification review schemas |
| `server/src/modules/masters/masters.repo.ts` | Modify | Filter featured by VERIFIED status |
| `server/src/modules/profiles/profiles.repo.ts` | Modify | Include verification fields in select |
| `server/src/app.ts` | Modify | Register verification routes |

### Client — New/Modified Files

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/features/verification/types/verification.types.ts` | Create | Verification types |
| `client/src/features/verification/services/verification.service.ts` | Create | API calls for verification |
| `client/src/features/verification/hooks/useVerification.ts` | Create | React Query hooks |
| `client/src/features/verification/components/VerificationStatus.tsx` | Create | Status display + request form |
| `client/src/features/verification/components/DocumentUpload.tsx` | Create | ID/cert/hygiene upload UI |
| `client/src/features/verification/components/BadgeManager.tsx` | Create | Tier 2 badge request UI |
| `client/src/features/admin/components/AdminVerificationQueue.tsx` | Create | Admin verification review UI |
| `client/src/features/admin/types/admin.types.ts` | Modify | Add verification types |
| `client/src/features/admin/services/admin.service.ts` | Modify | Add verification API calls |
| `client/src/features/admin/hooks/useAdmin.ts` | Modify | Add verification hooks |
| `client/src/app/(main)/admin/page.tsx` | Modify | Add VerificationQueue section |
| `client/src/app/(main)/dashboard/profile/page.tsx` | Modify | Add VerificationStatus section |
| `client/src/lib/constants/api-endpoints.ts` | Modify | Add verification endpoints |
| `client/src/features/masters/components/MasterCard.tsx` | Modify | Show badges on master cards |

---

## Chunk 1: Database Migration + Server Verification Module

### Task 1: Prisma Schema Migration

**Files:**
- Modify: `server/prisma/schema.prisma:192-209`

- [ ] **Step 1: Add verification and badge fields to MasterProfile**

Add these fields to the `MasterProfile` model:

```prisma
model MasterProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  city      String?
  niche     String?
  services  Json?
  bio       String?  @db.Text
  phone     String?
  whatsapp  String?
  telegram  String?
  instagram String?

  // Verification
  verificationStatus  String    @default("NONE")  // NONE, PENDING, VERIFIED, REJECTED
  idDocumentUrl       String?   @db.VarChar(1000)
  rejectionReason     String?   @db.VarChar(500)
  verifiedAt          DateTime?
  verifiedBy          String?

  // Tier 2 badges
  certificateUrl      String?   @db.VarChar(1000)
  hygienePicsUrl      Json?     // Array of image URLs showing workspace hygiene
  qualityProductsUrl  Json?     // Array of image URLs showing quality products used
  experienceYears     Int?

  // Badge statuses (admin-approved)
  isCertified           Boolean @default(false)
  isHygieneVerified     Boolean @default(false)
  isQualityProducts     Boolean @default(false)
  isTopRated            Boolean @default(false)  // Auto-set when 4.5+ avg, 10+ reviews

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([verificationStatus])
  @@map("master_profiles")
}
```

- [ ] **Step 2: Run migration**

```bash
cd server && npm run prisma:migrate dev -- --name add_master_verification
```

- [ ] **Step 3: Verify migration applied**

```bash
cd server && npm run prisma:generate
```

- [ ] **Step 4: Commit**

```bash
git add server/prisma/
git commit -m "feat: add master verification and badge fields to schema"
```

---

### Task 2: Server Verification Types + Schemas

**Files:**
- Create: `server/src/modules/verification/verification.types.ts`
- Create: `server/src/modules/verification/verification.schemas.ts`

- [ ] **Step 1: Create verification types**

```typescript
// server/src/modules/verification/verification.types.ts
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface VerificationState {
  verificationStatus: VerificationStatus;
  idDocumentUrl: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  certificateUrl: string | null;
  hygienePicsUrl: string[] | null;
  qualityProductsUrl: string[] | null;
  experienceYears: number | null;
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
  isTopRated: boolean;
}

export interface VerificationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  niche: string | null;
  city: string | null;
  verificationStatus: VerificationStatus;
  idDocumentUrl: string | null;
  portfolioCount: number;
  phoneVerified: boolean;
  createdAt: string;
  certificateUrl: string | null;
  hygienePicsUrl: string[] | null;
  qualityProductsUrl: string[] | null;
  experienceYears: number | null;
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
}
```

- [ ] **Step 2: Create verification schemas**

```typescript
// server/src/modules/verification/verification.schemas.ts
import { z } from 'zod';

export const RequestVerificationSchema = z.object({
  experienceYears: z.number().int().min(0).max(50).optional(),
});

export type RequestVerificationInput = z.infer<typeof RequestVerificationSchema>;

export const AdminReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export type AdminReviewInput = z.infer<typeof AdminReviewSchema>;

export const AdminBadgeSchema = z.object({
  badge: z.enum(['isCertified', 'isHygieneVerified', 'isQualityProducts']),
  granted: z.boolean(),
});

export type AdminBadgeInput = z.infer<typeof AdminBadgeSchema>;

export const VerificationUserParamsSchema = z.object({
  userId: z.string().uuid(),
});
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/verification/
git commit -m "feat: add verification types and schemas"
```

---

### Task 3: Server Verification Repo

**Files:**
- Create: `server/src/modules/verification/verification.repo.ts`

- [ ] **Step 1: Create verification repo**

```typescript
// server/src/modules/verification/verification.repo.ts
import { prisma } from '@/libs/prisma.js';

const VERIFICATION_SELECT = {
  verificationStatus: true,
  idDocumentUrl: true,
  rejectionReason: true,
  verifiedAt: true,
  verifiedBy: true,
  certificateUrl: true,
  hygienePicsUrl: true,
  qualityProductsUrl: true,
  experienceYears: true,
  isCertified: true,
  isHygieneVerified: true,
  isQualityProducts: true,
  isTopRated: true,
} as const;

export const verificationRepo = {
  async getVerificationState(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: VERIFICATION_SELECT,
    });
  },

  async submitVerification(userId: string, data: { experienceYears?: number }) {
    return prisma.masterProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'PENDING',
        ...(data.experienceYears !== undefined ? { experienceYears: data.experienceYears } : {}),
      },
      select: VERIFICATION_SELECT,
    });
  },

  async updateIdDocument(userId: string, url: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { idDocumentUrl: url },
    });
  },

  async updateCertificate(userId: string, url: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { certificateUrl: url },
    });
  },

  async updateHygienePics(userId: string, urls: string[]) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { hygienePicsUrl: urls },
    });
  },

  async updateQualityProductsPics(userId: string, urls: string[]) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { qualityProductsUrl: urls },
    });
  },

  async approveVerification(userId: string, adminId: string) {
    return prisma.$transaction([
      prisma.masterProfile.update({
        where: { userId },
        data: {
          verificationStatus: 'VERIFIED',
          rejectionReason: null,
          verifiedAt: new Date(),
          verifiedBy: adminId,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: 'MASTER' },
      }),
    ]);
  },

  async rejectVerification(userId: string, reason: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason,
      },
    });
  },

  async setBadge(userId: string, badge: string, granted: boolean) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { [badge]: granted },
    });
  },

  async findPendingVerifications(page: number, limit: number) {
    const where = {
      verificationStatus: { in: ['PENDING'] },
    };

    const [items, totalItems] = await Promise.all([
      prisma.masterProfile.findMany({
        where,
        select: {
          userId: true,
          verificationStatus: true,
          idDocumentUrl: true,
          city: true,
          niche: true,
          certificateUrl: true,
          hygienePicsUrl: true,
          qualityProductsUrl: true,
          experienceYears: true,
          isCertified: true,
          isHygieneVerified: true,
          isQualityProducts: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phoneVerified: true,
              _count: {
                select: {
                  portfolioItems: { where: { isPublished: true } },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.masterProfile.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        userId: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        avatar: p.user.avatar,
        niche: p.niche,
        city: p.city,
        verificationStatus: p.verificationStatus,
        idDocumentUrl: p.idDocumentUrl,
        portfolioCount: p.user._count.portfolioItems,
        phoneVerified: p.user.phoneVerified,
        createdAt: p.createdAt.toISOString(),
        certificateUrl: p.certificateUrl,
        hygienePicsUrl: p.hygienePicsUrl as string[] | null,
        qualityProductsUrl: p.qualityProductsUrl as string[] | null,
        experienceYears: p.experienceYears,
        isCertified: p.isCertified,
        isHygieneVerified: p.isHygieneVerified,
        isQualityProducts: p.isQualityProducts,
      })),
      totalItems,
    };
  },

  async findAllVerificationRequests(page: number, limit: number, status?: string) {
    const where = status ? { verificationStatus: status } : { verificationStatus: { not: 'NONE' } };

    const [items, totalItems] = await Promise.all([
      prisma.masterProfile.findMany({
        where,
        select: {
          userId: true,
          verificationStatus: true,
          idDocumentUrl: true,
          city: true,
          niche: true,
          certificateUrl: true,
          hygienePicsUrl: true,
          qualityProductsUrl: true,
          experienceYears: true,
          isCertified: true,
          isHygieneVerified: true,
          isQualityProducts: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phoneVerified: true,
              _count: {
                select: {
                  portfolioItems: { where: { isPublished: true } },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.masterProfile.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        userId: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        avatar: p.user.avatar,
        niche: p.niche,
        city: p.city,
        verificationStatus: p.verificationStatus,
        idDocumentUrl: p.idDocumentUrl,
        portfolioCount: p.user._count.portfolioItems,
        phoneVerified: p.user.phoneVerified,
        createdAt: p.createdAt.toISOString(),
        certificateUrl: p.certificateUrl,
        hygienePicsUrl: p.hygienePicsUrl as string[] | null,
        qualityProductsUrl: p.qualityProductsUrl as string[] | null,
        experienceYears: p.experienceYears,
        isCertified: p.isCertified,
        isHygieneVerified: p.isHygieneVerified,
        isQualityProducts: p.isQualityProducts,
      })),
      totalItems,
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/verification/
git commit -m "feat: add verification repository"
```

---

### Task 4: Server Verification Service

**Files:**
- Create: `server/src/modules/verification/verification.service.ts`

- [ ] **Step 1: Create verification service**

```typescript
// server/src/modules/verification/verification.service.ts
import { verificationRepo } from './verification.repo.js';
import { BadRequestError, NotFoundError } from '@/shared/errors/errors.js';
import type { RequestVerificationInput, AdminReviewInput, AdminBadgeInput } from './verification.schemas.js';
import { prisma } from '@/libs/prisma.js';
import { logger } from '@/libs/logger.js';

export function createVerificationService() {
  return {
    async getVerificationState(userId: string) {
      const state = await verificationRepo.getVerificationState(userId);
      if (!state) {
        throw new NotFoundError('Master profile not found. Complete your profile first.', 'PROFILE_NOT_FOUND');
      }
      return state;
    },

    async requestVerification(userId: string, input: RequestVerificationInput) {
      // Check profile exists
      const profile = await prisma.masterProfile.findUnique({
        where: { userId },
        select: {
          verificationStatus: true,
          idDocumentUrl: true,
          city: true,
          niche: true,
          bio: true,
        },
      });

      if (!profile) {
        throw new BadRequestError('Complete your master profile first', 'PROFILE_INCOMPLETE');
      }

      if (profile.verificationStatus === 'PENDING') {
        throw new BadRequestError('Verification already pending', 'ALREADY_PENDING');
      }

      if (profile.verificationStatus === 'VERIFIED') {
        throw new BadRequestError('Already verified', 'ALREADY_VERIFIED');
      }

      // Check user has phone verified
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneVerified: true },
      });

      if (!user?.phoneVerified) {
        throw new BadRequestError('Phone verification required', 'PHONE_NOT_VERIFIED');
      }

      // Check ID document uploaded
      if (!profile.idDocumentUrl) {
        throw new BadRequestError('Upload your ID document first', 'ID_DOCUMENT_REQUIRED');
      }

      // Check minimum 5 published portfolio items
      const portfolioCount = await prisma.portfolioItem.count({
        where: { userId, isPublished: true },
      });

      if (portfolioCount < 5) {
        throw new BadRequestError(
          `Minimum 5 published portfolio items required. You have ${portfolioCount}.`,
          'INSUFFICIENT_PORTFOLIO',
        );
      }

      // Check profile completeness
      if (!profile.city || !profile.niche) {
        throw new BadRequestError('Fill in your city and specialty', 'PROFILE_INCOMPLETE');
      }

      const result = await verificationRepo.submitVerification(userId, {
        experienceYears: input.experienceYears,
      });

      logger.info({ userId }, 'Master verification requested');
      return result;
    },

    async adminReview(userId: string, adminId: string, input: AdminReviewInput) {
      const profile = await prisma.masterProfile.findUnique({
        where: { userId },
        select: { verificationStatus: true },
      });

      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (input.action === 'approve') {
        await verificationRepo.approveVerification(userId, adminId);
        logger.info({ userId, adminId }, 'Master verification approved');
      } else {
        if (!input.rejectionReason) {
          throw new BadRequestError('Rejection reason is required', 'REASON_REQUIRED');
        }
        await verificationRepo.rejectVerification(userId, input.rejectionReason);
        logger.info({ userId, adminId, reason: input.rejectionReason }, 'Master verification rejected');
      }
    },

    async adminSetBadge(userId: string, input: AdminBadgeInput) {
      const profile = await prisma.masterProfile.findUnique({
        where: { userId },
        select: { verificationStatus: true },
      });

      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      await verificationRepo.setBadge(userId, input.badge, input.granted);
      logger.info({ userId, badge: input.badge, granted: input.granted }, 'Badge updated');
    },

    async getPendingVerifications(page: number, limit: number) {
      return verificationRepo.findPendingVerifications(page, limit);
    },

    async getAllVerifications(page: number, limit: number, status?: string) {
      return verificationRepo.findAllVerificationRequests(page, limit, status);
    },
  };
}

export type VerificationService = ReturnType<typeof createVerificationService>;
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/verification/
git commit -m "feat: add verification service with business logic"
```

---

### Task 5: Server Verification Controller + Routes

**Files:**
- Create: `server/src/modules/verification/verification.controller.ts`
- Create: `server/src/modules/verification/verification.routes.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create verification controller**

```typescript
// server/src/modules/verification/verification.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { RequestVerificationSchema } from './verification.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { uploadFile, validateImage, processImage } from '@/libs/storage.js';
import type { VerificationService } from './verification.service.js';

export function createVerificationController(service: VerificationService) {
  return {
    async getState(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const state = await service.getVerificationState(request.user!.id);
      reply.send(successResponse('Verification state retrieved', state));
    },

    async requestVerification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RequestVerificationSchema.parse(request.body);
      const result = await service.requestVerification(request.user!.id, input);
      reply.send(successResponse('Verification requested', result));
    },

    async uploadIdDocument(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const data = await request.file();
      if (!data) {
        reply.status(400).send({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
      }

      const file = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      validateImage(file, 10 * 1024 * 1024); // 10MB for documents
      const processed = await processImage(file);
      const url = await uploadFile(processed, 'verification/id');

      const { verificationRepo } = await import('./verification.repo.js');
      await verificationRepo.updateIdDocument(request.user!.id, url);

      reply.send(successResponse('ID document uploaded', { url }));
    },

    async uploadCertificate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const data = await request.file();
      if (!data) {
        reply.status(400).send({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
      }

      const file = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      validateImage(file, 10 * 1024 * 1024);
      const processed = await processImage(file);
      const url = await uploadFile(processed, 'verification/certificates');

      const { verificationRepo } = await import('./verification.repo.js');
      await verificationRepo.updateCertificate(request.user!.id, url);

      reply.send(successResponse('Certificate uploaded', { url }));
    },

    async uploadHygienePics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const parts = request.files();
      const urls: string[] = [];

      for await (const part of parts) {
        const file = {
          buffer: await part.toBuffer(),
          filename: part.filename,
          mimetype: part.mimetype,
        };
        validateImage(file, 10 * 1024 * 1024);
        const processed = await processImage(file);
        const url = await uploadFile(processed, 'verification/hygiene');
        urls.push(url);
      }

      if (urls.length === 0) {
        reply.status(400).send({ success: false, error: { code: 'NO_FILES', message: 'No files uploaded' } });
        return;
      }

      const { verificationRepo } = await import('./verification.repo.js');
      // Get existing URLs and append
      const existing = await verificationRepo.getVerificationState(request.user!.id);
      const existingUrls = (existing?.hygienePicsUrl as string[] | null) ?? [];
      const allUrls = [...existingUrls, ...urls].slice(0, 10); // Max 10 pics

      await verificationRepo.updateHygienePics(request.user!.id, allUrls);

      reply.send(successResponse('Hygiene photos uploaded', { urls: allUrls }));
    },

    async uploadQualityProductsPics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const parts = request.files();
      const urls: string[] = [];

      for await (const part of parts) {
        const file = {
          buffer: await part.toBuffer(),
          filename: part.filename,
          mimetype: part.mimetype,
        };
        validateImage(file, 10 * 1024 * 1024);
        const processed = await processImage(file);
        const url = await uploadFile(processed, 'verification/quality-products');
        urls.push(url);
      }

      if (urls.length === 0) {
        reply.status(400).send({ success: false, error: { code: 'NO_FILES', message: 'No files uploaded' } });
        return;
      }

      const { verificationRepo } = await import('./verification.repo.js');
      const existing = await verificationRepo.getVerificationState(request.user!.id);
      const existingUrls = (existing?.qualityProductsUrl as string[] | null) ?? [];
      const allUrls = [...existingUrls, ...urls].slice(0, 10);

      await verificationRepo.updateQualityProductsPics(request.user!.id, allUrls);

      reply.send(successResponse('Quality products photos uploaded', { urls: allUrls }));
    },
  };
}
```

- [ ] **Step 2: Create verification routes**

```typescript
// server/src/modules/verification/verification.routes.ts
import type { FastifyInstance } from 'fastify';
import { createVerificationController } from './verification.controller.js';
import { createVerificationService } from './verification.service.js';
import { authenticate, requirePhoneVerified } from '@/libs/auth.js';

export async function verificationRoutes(app: FastifyInstance): Promise<void> {
  const service = createVerificationService();
  const controller = createVerificationController(service);

  const authGuard = [authenticate, requirePhoneVerified];

  app.get('/state', { preHandler: authGuard }, controller.getState);
  app.post('/request', { preHandler: authGuard }, controller.requestVerification);
  app.post('/upload-id', { preHandler: authGuard }, controller.uploadIdDocument);
  app.post('/upload-certificate', { preHandler: authGuard }, controller.uploadCertificate);
  app.post('/upload-hygiene', { preHandler: authGuard }, controller.uploadHygienePics);
  app.post('/upload-quality-products', { preHandler: authGuard }, controller.uploadQualityProductsPics);
}
```

- [ ] **Step 3: Register routes in app.ts**

Add to `server/src/app.ts`:

```typescript
import { verificationRoutes } from '@/modules/verification/verification.routes.js';
// ...in route registration section:
await app.register(verificationRoutes, { prefix: '/api/v1/verification' });
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/verification/ server/src/app.ts
git commit -m "feat: add verification controller and routes"
```

---

### Task 6: Admin Verification Endpoints

**Files:**
- Modify: `server/src/modules/admin/admin.routes.ts`
- Modify: `server/src/modules/admin/admin.controller.ts`
- Modify: `server/src/modules/admin/admin.service.ts`
- Modify: `server/src/modules/admin/admin.schemas.ts`

- [ ] **Step 1: Add admin schemas**

Append to `server/src/modules/admin/admin.schemas.ts`:

```typescript
export const AdminVerificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

export type AdminVerificationsQuery = z.infer<typeof AdminVerificationsQuerySchema>;

export const AdminVerificationReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
}).refine(
  (data) => data.action === 'approve' || (data.rejectionReason && data.rejectionReason.length > 0),
  { message: 'Rejection reason is required when rejecting', path: ['rejectionReason'] },
);

export type AdminVerificationReview = z.infer<typeof AdminVerificationReviewSchema>;

export const AdminBadgeUpdateSchema = z.object({
  badge: z.enum(['isCertified', 'isHygieneVerified', 'isQualityProducts']),
  granted: z.boolean(),
});

export type AdminBadgeUpdate = z.infer<typeof AdminBadgeUpdateSchema>;

export const verificationUserParamsSchema = z.object({
  userId: z.string().uuid(),
});
```

- [ ] **Step 2: Add admin service methods**

Add to `createAdminService()` in `server/src/modules/admin/admin.service.ts`:

```typescript
async getVerifications(query: AdminVerificationsQuery) {
  const { page, limit, status } = query;
  const { verificationRepo } = await import('../verification/verification.repo.js');
  if (status === 'PENDING') {
    return verificationRepo.findPendingVerifications(page, limit);
  }
  return verificationRepo.findAllVerificationRequests(page, limit, status);
},

async reviewVerification(userId: string, adminId: string, input: AdminVerificationReview) {
  const { createVerificationService } = await import('../verification/verification.service.js');
  const verificationService = createVerificationService();
  await verificationService.adminReview(userId, adminId, input);
},

async updateBadge(userId: string, input: AdminBadgeUpdate) {
  const { createVerificationService } = await import('../verification/verification.service.js');
  const verificationService = createVerificationService();
  await verificationService.adminSetBadge(userId, input);
},
```

- [ ] **Step 3: Add admin controller methods**

Add to `createAdminController()` in `server/src/modules/admin/admin.controller.ts`:

```typescript
async getVerifications(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { AdminVerificationsQuerySchema } = await import('./admin.schemas.js');
  const query = AdminVerificationsQuerySchema.parse(request.query);
  const { items, totalItems } = await adminService.getVerifications(query);
  reply.send(paginatedResponse('Verifications retrieved', items, query.page, query.limit, totalItems));
},

async reviewVerification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { verificationUserParamsSchema, AdminVerificationReviewSchema } = await import('./admin.schemas.js');
  const { userId } = verificationUserParamsSchema.parse(request.params);
  const input = AdminVerificationReviewSchema.parse(request.body);
  await adminService.reviewVerification(userId, request.user!.id, input);
  reply.send(successResponse(`Verification ${input.action}d`, null));
},

async updateBadge(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { verificationUserParamsSchema, AdminBadgeUpdateSchema } = await import('./admin.schemas.js');
  const { userId } = verificationUserParamsSchema.parse(request.params);
  const input = AdminBadgeUpdateSchema.parse(request.body);
  await adminService.updateBadge(userId, input);
  reply.send(successResponse(`Badge ${input.granted ? 'granted' : 'revoked'}`, null));
},
```

- [ ] **Step 4: Add admin routes**

Add to `server/src/modules/admin/admin.routes.ts`:

```typescript
app.get('/verifications', { preHandler: adminGuard }, controller.getVerifications);
app.patch('/verifications/:userId', { preHandler: adminGuard }, controller.reviewVerification);
app.patch('/badges/:userId', { preHandler: adminGuard }, controller.updateBadge);
```

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/admin/
git commit -m "feat: add admin verification review and badge management endpoints"
```

---

### Task 7: Filter Featured Masters by Verification Status

**Files:**
- Modify: `server/src/modules/masters/masters.repo.ts:48-81`
- Modify: `server/src/modules/profiles/profiles.repo.ts:4-17`

- [ ] **Step 1: Add verificationStatus filter to featured masters**

In `server/src/modules/masters/masters.repo.ts`, update `MASTER_SELECT` to include badge fields:

```typescript
const MASTER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,
  masterProfile: {
    select: {
      city: true,
      niche: true,
      verificationStatus: true,
      isCertified: true,
      isHygieneVerified: true,
      isQualityProducts: true,
      isTopRated: true,
    },
  },
  brandingProfile: {
    select: {
      displayName: true,
    },
  },
  portfolioItems: {
    where: { isPublished: true },
    select: {
      id: true,
      imageUrl: true,
      title: true,
    },
    orderBy: { sortOrder: 'asc' as const },
    take: 4,
  },
  _count: {
    select: {
      portfolioItems: {
        where: { isPublished: true },
      },
    },
  },
} satisfies Prisma.UserSelect;
```

Update `mapMaster` to include badges:

```typescript
function mapMaster(m: any) {
  return {
    username: m.username!,
    displayName: m.brandingProfile?.displayName ?? `${m.firstName} ${m.lastName}`,
    avatar: m.avatar,
    city: m.masterProfile?.city ?? null,
    niche: m.masterProfile?.niche ?? null,
    isVerified: m.masterProfile?.verificationStatus === 'VERIFIED',
    badges: {
      isCertified: m.masterProfile?.isCertified ?? false,
      isHygieneVerified: m.masterProfile?.isHygieneVerified ?? false,
      isQualityProducts: m.masterProfile?.isQualityProducts ?? false,
      isTopRated: m.masterProfile?.isTopRated ?? false,
    },
    portfolioImages: m.portfolioItems.map((item: any) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
    })),
    totalItems: m._count.portfolioItems,
  };
}
```

Update `findFeaturedMasters` to filter by VERIFIED:

```typescript
async findFeaturedMasters(limit: number = 12, niche?: string) {
  const where = buildWhere({ niche });
  // Featured: only verified masters
  where.masterProfile = {
    ...(typeof where.masterProfile === 'object' && where.masterProfile !== null && 'is' in where.masterProfile
      ? { is: { ...where.masterProfile.is, verificationStatus: 'VERIFIED' } }
      : { is: { verificationStatus: 'VERIFIED' } }),
  };

  const masters = await prisma.user.findMany({
    where,
    select: MASTER_SELECT,
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return masters.map(mapMaster);
},
```

- [ ] **Step 2: Update profiles repo to include verification fields**

In `server/src/modules/profiles/profiles.repo.ts`, update `PROFILE_SELECT`:

```typescript
const PROFILE_SELECT = {
  id: true,
  userId: true,
  city: true,
  niche: true,
  bio: true,
  phone: true,
  whatsapp: true,
  telegram: true,
  instagram: true,
  services: true,
  verificationStatus: true,
  idDocumentUrl: true,
  rejectionReason: true,
  verifiedAt: true,
  certificateUrl: true,
  hygienePicsUrl: true,
  qualityProductsUrl: true,
  experienceYears: true,
  isCertified: true,
  isHygieneVerified: true,
  isQualityProducts: true,
  isTopRated: true,
  createdAt: true,
  updatedAt: true,
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/masters/ server/src/modules/profiles/
git commit -m "feat: filter featured masters by verified status, add badges to catalog"
```

---

## Chunk 2: Client — Verification UI

### Task 8: Client Types + Service + Hooks

**Files:**
- Create: `client/src/features/verification/types/verification.types.ts`
- Create: `client/src/features/verification/services/verification.service.ts`
- Create: `client/src/features/verification/hooks/useVerification.ts`
- Modify: `client/src/lib/constants/api-endpoints.ts`

- [ ] **Step 1: Add verification API endpoints**

Add to `client/src/lib/constants/api-endpoints.ts`:

```typescript
VERIFICATION: {
    STATE: '/verification/state',
    REQUEST: '/verification/request',
    UPLOAD_ID: '/verification/upload-id',
    UPLOAD_CERTIFICATE: '/verification/upload-certificate',
    UPLOAD_HYGIENE: '/verification/upload-hygiene',
    UPLOAD_QUALITY_PRODUCTS: '/verification/upload-quality-products',
},
```

Add to the ADMIN section:

```typescript
VERIFICATIONS: '/admin/verifications',
VERIFICATION_REVIEW: (userId: string) => `/admin/verifications/${userId}`,
BADGE_UPDATE: (userId: string) => `/admin/badges/${userId}`,
```

- [ ] **Step 2: Create verification types**

```typescript
// client/src/features/verification/types/verification.types.ts
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface VerificationState {
  verificationStatus: VerificationStatus;
  idDocumentUrl: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  certificateUrl: string | null;
  hygienePicsUrl: string[] | null;
  qualityProductsUrl: string[] | null;
  experienceYears: number | null;
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
  isTopRated: boolean;
}

export interface VerificationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  niche: string | null;
  city: string | null;
  verificationStatus: VerificationStatus;
  idDocumentUrl: string | null;
  portfolioCount: number;
  phoneVerified: boolean;
  createdAt: string;
  certificateUrl: string | null;
  hygienePicsUrl: string[] | null;
  qualityProductsUrl: string[] | null;
  experienceYears: number | null;
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
}

export interface MasterBadges {
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
  isTopRated: boolean;
}
```

- [ ] **Step 3: Create verification service**

```typescript
// client/src/features/verification/services/verification.service.ts
import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { VerificationState } from '../types/verification.types';

class VerificationService {
  async getState(): Promise<VerificationState> {
    const { data } = await apiClient.get<ApiResponse<VerificationState>>(
      API_ENDPOINTS.VERIFICATION.STATE,
    );
    return data.data;
  }

  async requestVerification(experienceYears?: number): Promise<VerificationState> {
    const { data } = await apiClient.post<ApiResponse<VerificationState>>(
      API_ENDPOINTS.VERIFICATION.REQUEST,
      { experienceYears },
    );
    return data.data;
  }

  async uploadIdDocument(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ url: string }>>(
      API_ENDPOINTS.VERIFICATION.UPLOAD_ID,
      formData,
    );
    return data.data;
  }

  async uploadCertificate(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiResponse<{ url: string }>>(
      API_ENDPOINTS.VERIFICATION.UPLOAD_CERTIFICATE,
      formData,
    );
    return data.data;
  }

  async uploadHygienePics(files: File[]): Promise<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const { data } = await apiClient.post<ApiResponse<{ urls: string[] }>>(
      API_ENDPOINTS.VERIFICATION.UPLOAD_HYGIENE,
      formData,
    );
    return data.data;
  }

  async uploadQualityProductsPics(files: File[]): Promise<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const { data } = await apiClient.post<ApiResponse<{ urls: string[] }>>(
      API_ENDPOINTS.VERIFICATION.UPLOAD_QUALITY_PRODUCTS,
      formData,
    );
    return data.data;
  }
}

export const verificationService = new VerificationService();
```

- [ ] **Step 4: Create verification hooks**

```typescript
// client/src/features/verification/hooks/useVerification.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { verificationService } from '../services/verification.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { VerificationState } from '../types/verification.types';

export const verificationKeys = {
  all: ['verification'] as const,
  state: () => [...verificationKeys.all, 'state'] as const,
};

export function useVerificationState(): {
  state: VerificationState | undefined;
  isLoading: boolean;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: verificationKeys.state(),
    queryFn: () => verificationService.getState(),
  });

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error));
  }, [error]);

  return { state: data, isLoading };
}

export function useRequestVerification(): {
  request: (experienceYears?: number) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (experienceYears?: number) =>
      verificationService.requestVerification(experienceYears),
    onSuccess: () => {
      toast.success('Verification request submitted');
      queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { request: mutate, isPending };
}

export function useUploadIdDocument(): {
  upload: (file: File) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (file: File) => verificationService.uploadIdDocument(file),
    onSuccess: () => {
      toast.success('ID document uploaded');
      queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { upload: mutate, isPending };
}

export function useUploadCertificate(): {
  upload: (file: File) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (file: File) => verificationService.uploadCertificate(file),
    onSuccess: () => {
      toast.success('Certificate uploaded');
      queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { upload: mutate, isPending };
}

export function useUploadHygienePics(): {
  upload: (files: File[]) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (files: File[]) => verificationService.uploadHygienePics(files),
    onSuccess: () => {
      toast.success('Hygiene photos uploaded');
      queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { upload: mutate, isPending };
}

export function useUploadQualityProductsPics(): {
  upload: (files: File[]) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (files: File[]) => verificationService.uploadQualityProductsPics(files),
    onSuccess: () => {
      toast.success('Quality products photos uploaded');
      queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { upload: mutate, isPending };
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/features/verification/ client/src/lib/constants/api-endpoints.ts
git commit -m "feat: add verification types, service, and hooks"
```

---

### Task 9: Client — Verification Status Component (Dashboard Profile)

**Files:**
- Create: `client/src/features/verification/components/VerificationSection.tsx`
- Modify: `client/src/app/(main)/dashboard/profile/page.tsx`

- [ ] **Step 1: Create VerificationSection component**

This component shows:
- Current verification status (NONE/PENDING/VERIFIED/REJECTED)
- ID document upload
- Portfolio count check
- Submit button (only enabled when requirements met)
- Tier 2 badge uploads (certificate, hygiene pics, quality products pics)
- Experience years input

Build with shadcn/ui (Button, Input, Label, Badge), Phosphor Icons, Tailwind.

Key states:
- `NONE` → Show requirements checklist + upload areas + submit button
- `PENDING` → Show "Under review" message with clock icon
- `VERIFIED` → Show green "Verified" badge + Tier 2 badge management
- `REJECTED` → Show rejection reason + allow re-submission

Requirements checklist items:
- Phone verified ✓/✗
- Profile complete (city + niche) ✓/✗
- ID document uploaded ✓/✗
- 5+ portfolio items ✓/✗

Tier 2 section (always visible for verified masters, visible below the requirements for others):
- Certificate upload (single file)
- Hygiene workspace photos (multi-file, max 10)
- Quality products photos (multi-file, max 10)
- Experience years (number input)

Use the `useVerificationState`, `useRequestVerification`, `useUploadIdDocument`, `useUploadCertificate`, `useUploadHygienePics`, `useUploadQualityProductsPics` hooks.

The component should follow the design system rules — rounded-xl cards, semantic colors, proper spacing, motion-safe transitions.

- [ ] **Step 2: Add VerificationSection to dashboard profile page**

In `client/src/app/(main)/dashboard/profile/page.tsx`, add between AccountStatus and PersonalInfoSection:

```tsx
import { VerificationSection } from '@/features/verification/components/VerificationSection';

// In the JSX, after AccountStatus:
<VerificationSection />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/features/verification/components/ client/src/app/(main)/dashboard/profile/page.tsx
git commit -m "feat: add verification section to dashboard profile"
```

---

### Task 10: Client — Admin Verification Queue

**Files:**
- Create: `client/src/features/admin/components/AdminVerificationQueue.tsx`
- Modify: `client/src/features/admin/services/admin.service.ts`
- Modify: `client/src/features/admin/hooks/useAdmin.ts`
- Modify: `client/src/features/admin/types/admin.types.ts`
- Modify: `client/src/app/(main)/admin/page.tsx`

- [ ] **Step 1: Add admin verification types**

Append to `client/src/features/admin/types/admin.types.ts`:

```typescript
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AdminVerificationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  niche: string | null;
  city: string | null;
  verificationStatus: VerificationStatus;
  idDocumentUrl: string | null;
  portfolioCount: number;
  phoneVerified: boolean;
  createdAt: string;
  certificateUrl: string | null;
  hygienePicsUrl: string[] | null;
  qualityProductsUrl: string[] | null;
  experienceYears: number | null;
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
}

export type BadgeType = 'isCertified' | 'isHygieneVerified' | 'isQualityProducts';
```

- [ ] **Step 2: Add admin verification service methods**

Append to `AdminService` class in `client/src/features/admin/services/admin.service.ts`:

```typescript
async getVerifications(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ items: AdminVerificationRequest[]; pagination: PaginationMeta }> {
  const { data } = await apiClient.get<PaginatedApiResponse<AdminVerificationRequest>>(
    API_ENDPOINTS.ADMIN.VERIFICATIONS,
    { params },
  );
  return { items: data.data.items, pagination: data.data.pagination };
}

async reviewVerification(
  userId: string,
  body: { action: 'approve' | 'reject'; rejectionReason?: string },
): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.ADMIN.VERIFICATION_REVIEW(userId), body);
}

async updateBadge(
  userId: string,
  body: { badge: string; granted: boolean },
): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.ADMIN.BADGE_UPDATE(userId), body);
}
```

- [ ] **Step 3: Add admin verification hooks**

Append to `client/src/features/admin/hooks/useAdmin.ts`:

```typescript
export function useAdminVerifications(
  page: number,
  limit: number,
  status?: string,
): {
  requests: AdminVerificationRequest[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'verifications', { page, limit, status }],
    queryFn: () => adminService.getVerifications({ page, limit, status }),
  });

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error));
  }, [error]);

  return {
    requests: data?.items ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
  };
}

export function useReviewVerification(): {
  review: (data: { userId: string; action: 'approve' | 'reject'; rejectionReason?: string }) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: { userId: string; action: 'approve' | 'reject'; rejectionReason?: string }) =>
      adminService.reviewVerification(data.userId, { action: data.action, rejectionReason: data.rejectionReason }),
    onSuccess: (_, variables) => {
      toast.success(`Verification ${variables.action}d`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { review: mutate, isPending };
}

export function useUpdateBadge(): {
  update: (data: { userId: string; badge: string; granted: boolean }) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: { userId: string; badge: string; granted: boolean }) =>
      adminService.updateBadge(data.userId, { badge: data.badge, granted: data.granted }),
    onSuccess: (_, variables) => {
      toast.success(`Badge ${variables.granted ? 'granted' : 'revoked'}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return { update: mutate, isPending };
}
```

- [ ] **Step 4: Create AdminVerificationQueue component**

This shows:
- Tab filter: All | Pending | Verified | Rejected
- List of verification requests with:
  - Master name, avatar, niche, city
  - Phone verified status
  - Portfolio count
  - ID document image (clickable to view full size)
  - Certificate image if uploaded
  - Hygiene photos if uploaded (thumbnail grid)
  - Quality products photos if uploaded (thumbnail grid)
  - Experience years
  - Approve/Reject buttons (with rejection reason textarea)
  - Badge toggle buttons (Certified, Hygiene, Quality Products)

- [ ] **Step 5: Add to admin page**

In `client/src/app/(main)/admin/page.tsx`:

```tsx
import { AdminVerificationQueue } from '@/features/admin/components/AdminVerificationQueue';

// Add after AdminStatsCards:
<AdminVerificationQueue />
```

- [ ] **Step 6: Commit**

```bash
git add client/src/features/admin/ client/src/app/(main)/admin/page.tsx
git commit -m "feat: add admin verification queue with badge management"
```

---

### Task 11: Client — Master Badges in Catalog/Featured

**Files:**
- Modify: `client/src/features/masters/types/masters.types.ts`
- Modify: `client/src/features/masters/components/FeaturedMasters.tsx` (or equivalent card component)
- Modify: `client/src/features/masters/components/MastersCatalog.tsx` (or equivalent)

- [ ] **Step 1: Update master types to include badges**

Add to master types:

```typescript
export interface MasterBadges {
  isCertified: boolean;
  isHygieneVerified: boolean;
  isQualityProducts: boolean;
  isTopRated: boolean;
}
```

Add `isVerified: boolean` and `badges: MasterBadges` to the `FeaturedMaster` / `CatalogMaster` interfaces.

- [ ] **Step 2: Add badge display to master cards**

Show small badge icons on master cards:
- Verified check (always shown for verified masters)
- Certificate badge (if `isCertified`)
- Hygiene badge (if `isHygieneVerified`)
- Quality products badge (if `isQualityProducts`)
- Top rated badge (if `isTopRated`)

Use Phosphor Icons: `SealCheck`, `Certificate`, `SprayBottle`, `Star`, `Diamond`

- [ ] **Step 3: Commit**

```bash
git add client/src/features/masters/
git commit -m "feat: show verification badges on master cards"
```

---

### Task 12: Final — Update Postman Collection

**Files:**
- Modify or create: `server/postman/collection.json`

- [ ] **Step 1: Add verification endpoints to Postman collection**

Add folder "Verification" with:
- GET `{{baseUrl}}/verification/state`
- POST `{{baseUrl}}/verification/request`
- POST `{{baseUrl}}/verification/upload-id` (multipart)
- POST `{{baseUrl}}/verification/upload-certificate` (multipart)
- POST `{{baseUrl}}/verification/upload-hygiene` (multipart)
- POST `{{baseUrl}}/verification/upload-quality-products` (multipart)

Add to "Admin" folder:
- GET `{{baseUrl}}/admin/verifications?status=PENDING`
- PATCH `{{baseUrl}}/admin/verifications/{{userId}}` (approve/reject)
- PATCH `{{baseUrl}}/admin/badges/{{userId}}` (badge toggle)

- [ ] **Step 2: Commit**

```bash
git add server/postman/
git commit -m "chore: update postman collection with verification endpoints"
```
