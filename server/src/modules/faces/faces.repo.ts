import { prisma } from '@/libs/prisma.js';
import type { Prisma } from '@prisma/client';
import type { CatalogQueryInput, UpdateModelProfileInput } from './faces.schemas.js';

const APPROVED_PHOTO = { moderationStatus: 'APPROVED' } as const;

const CARD_SELECT = {
  id: true,
  displayName: true,
  city: true,
  birthDate: true,
  heightCm: true,
  blurredAt: true,
  district: { select: { name: true, slug: true } },
  photos: {
    where: APPROVED_PHOTO,
    select: { id: true, imageUrl: true, isPrimary: true },
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    take: 4,
  },
  _count: { select: { interestedBy: true } },
} satisfies Prisma.ModelProfileSelect;

const DETAIL_SELECT = {
  ...CARD_SELECT,
  bio: true,
  measurements: true,
  hairColor: true,
  eyeColor: true,
  niches: true,
  // Contact, the SERVICE strips these unless the requester has liked the model.
  phone: true,
  whatsapp: true,
  telegram: true,
  instagram: true,
  photos: {
    where: APPROVED_PHOTO,
    select: { id: true, imageUrl: true, isPrimary: true },
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
  },
} satisfies Prisma.ModelProfileSelect;

const OWNER_SELECT = {
  id: true,
  displayName: true,
  birthDate: true,
  city: true,
  districtId: true,
  heightCm: true,
  measurements: true,
  hairColor: true,
  eyeColor: true,
  bio: true,
  niches: true,
  phone: true,
  whatsapp: true,
  telegram: true,
  instagram: true,
  consentVersion: true,
  consentAt: true,
  verificationStatus: true,
  rejectionReason: true,
  isActive: true,
  blurredAt: true,
  withdrawnAt: true,
  photos: {
    select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true, moderationStatus: true },
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
  },
  _count: { select: { interestedBy: true } },
} satisfies Prisma.ModelProfileSelect;

function buildCatalogWhere(filters: CatalogQueryInput): Prisma.ModelProfileWhereInput {
  const where: Prisma.ModelProfileWhereInput = {
    verificationStatus: 'VERIFIED',
    isActive: true,
    withdrawnAt: null,
    photos: { some: APPROVED_PHOTO },
  };
  if (filters.city) where.city = filters.city.toLowerCase();
  if (filters.district) where.district = { is: { slug: filters.district } };
  if (filters.niche) where.niches = { array_contains: filters.niche };
  if (filters.search) {
    where.displayName = { contains: filters.search.trim() };
  }
  return where;
}

export const facesRepo = {
  // ── Catalog (master-facing) ──
  async findCatalogModels(filters: CatalogQueryInput) {
    const where = buildCatalogWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, totalItems] = await Promise.all([
      prisma.modelProfile.findMany({
        where,
        select: CARD_SELECT,
        // `id` is the final tiebreaker so rows with equal interest-count + updatedAt keep a
        // stable order across skip/take pages (otherwise a page boundary can repeat/drop a row).
        orderBy: [{ interestedBy: { _count: 'desc' } }, { updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take: filters.limit,
      }),
      prisma.modelProfile.count({ where }),
    ]);

    return { items, totalItems };
  },

  async findDetailById(id: string) {
    return prisma.modelProfile.findFirst({
      where: { id, verificationStatus: 'VERIFIED', isActive: true, withdrawnAt: null },
      select: DETAIL_SELECT,
    });
  },

  // ── Owner (model self-service) ──
  async findIdByUserId(userId: string) {
    return prisma.modelProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  async findOwnProfile(userId: string) {
    return prisma.modelProfile.findUnique({
      where: { userId },
      select: OWNER_SELECT,
    });
  },

  async updateProfile(userId: string, data: UpdateModelProfileInput) {
    const patch: Prisma.ModelProfileUpdateInput = {};
    if (data.displayName !== undefined) patch.displayName = data.displayName;
    if (data.city !== undefined) patch.city = data.city;
    if (data.districtId !== undefined) {
      patch.district = data.districtId ? { connect: { id: data.districtId } } : { disconnect: true };
    }
    if (data.heightCm !== undefined) patch.heightCm = data.heightCm;
    if (data.measurements !== undefined) patch.measurements = data.measurements;
    if (data.hairColor !== undefined) patch.hairColor = data.hairColor;
    if (data.eyeColor !== undefined) patch.eyeColor = data.eyeColor;
    if (data.bio !== undefined) patch.bio = data.bio;
    if (data.niches !== undefined) patch.niches = data.niches as unknown as Prisma.InputJsonValue;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.whatsapp !== undefined) patch.whatsapp = data.whatsapp;
    if (data.telegram !== undefined) patch.telegram = data.telegram;
    if (data.instagram !== undefined) patch.instagram = data.instagram;

    return prisma.modelProfile.update({ where: { userId }, data: patch, select: OWNER_SELECT });
  },

  async setStatus(userId: string, data: Prisma.ModelProfileUpdateInput) {
    return prisma.modelProfile.update({ where: { userId }, data, select: OWNER_SELECT });
  },

  // ── Photos ──
  async getPhotoMaxSort(modelProfileId: string): Promise<number> {
    const r = await prisma.modelPhoto.aggregate({
      where: { modelProfileId },
      _max: { sortOrder: true },
    });
    return r._max.sortOrder ?? -1;
  },

  async countPhotos(modelProfileId: string): Promise<number> {
    return prisma.modelPhoto.count({ where: { modelProfileId } });
  },

  async addPhoto(modelProfileId: string, imageUrl: string, sortOrder: number, isPrimary: boolean) {
    return prisma.modelPhoto.create({
      data: { modelProfileId, imageUrl, sortOrder, isPrimary, moderationStatus: 'PENDING' },
      select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true, moderationStatus: true },
    });
  },

  async findPhotoById(photoId: string) {
    return prisma.modelPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, modelProfileId: true, imageUrl: true, isPrimary: true, moderationStatus: true },
    });
  },

  // Delete a photo and, if it was the primary, promote a replacement in ONE transaction so
  // the profile never ends up with zero primaries. Replacement = the remaining photo with the
  // lowest sortOrder, preferring an APPROVED one (only APPROVED photos are ever shown publicly).
  async deletePhoto(photoId: string, modelProfileId: string, wasPrimary: boolean) {
    return prisma.$transaction(async (tx) => {
      await tx.modelPhoto.delete({ where: { id: photoId } });
      if (!wasPrimary) return;
      const next =
        (await tx.modelPhoto.findFirst({
          where: { modelProfileId, moderationStatus: 'APPROVED' },
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        })) ??
        (await tx.modelPhoto.findFirst({
          where: { modelProfileId },
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        }));
      if (next) {
        await tx.modelPhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    });
  },

  async setPrimaryPhoto(modelProfileId: string, photoId: string) {
    return prisma.$transaction([
      prisma.modelPhoto.updateMany({ where: { modelProfileId }, data: { isPrimary: false } }),
      prisma.modelPhoto.update({ where: { id: photoId }, data: { isPrimary: true } }),
    ]);
  },

  async updatePhotoModeration(photoId: string, status: string) {
    return prisma.modelPhoto.update({
      where: { id: photoId },
      data: { moderationStatus: status },
      select: { id: true, moderationStatus: true },
    });
  },

  async listPhotosForWithdraw(modelProfileId: string) {
    return prisma.modelPhoto.findMany({ where: { modelProfileId }, select: { imageUrl: true } });
  },

  // ── Interest (FavoriteModel) ──
  async findInterest(userId: string, modelProfileId: string) {
    return prisma.favoriteModel.findUnique({
      where: { userId_modelProfileId: { userId, modelProfileId } },
      select: { id: true },
    });
  },

  async addInterest(userId: string, modelProfileId: string) {
    return prisma.favoriteModel.create({ data: { userId, modelProfileId }, select: { id: true } });
  },

  async removeInterest(userId: string, modelProfileId: string) {
    return prisma.favoriteModel.delete({
      where: { userId_modelProfileId: { userId, modelProfileId } },
    });
  },

  async checkInterestStatus(userId: string, modelProfileIds: string[]): Promise<Record<string, boolean>> {
    const rows = await prisma.favoriteModel.findMany({
      where: { userId, modelProfileId: { in: modelProfileIds } },
      select: { modelProfileId: true },
    });
    const liked = new Set(rows.map((r) => r.modelProfileId));
    return Object.fromEntries(modelProfileIds.map((id) => [id, liked.has(id)]));
  },

  // ── Admin moderation ──
  async findVerificationStatus(modelProfileId: string) {
    return prisma.modelProfile.findUnique({
      where: { id: modelProfileId },
      select: { id: true, verificationStatus: true },
    });
  },

  async findStatusByUserId(userId: string) {
    return prisma.modelProfile.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true },
    });
  },

  async approveByUserId(userId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.modelProfile.update({
        where: { userId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: adminId,
          rejectionReason: null,
        },
        select: { id: true, verificationStatus: true },
      });
      await tx.modelPhoto.updateMany({
        where: { modelProfileId: profile.id, moderationStatus: 'PENDING' },
        data: { moderationStatus: 'APPROVED' },
      });
      return profile;
    });
  },

  async rejectByUserId(userId: string, reason: string) {
    return prisma.modelProfile.update({
      where: { userId },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
      select: { id: true, verificationStatus: true },
    });
  },

  async findUserPhoneByModelUserId(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerified: true },
    });
  },

  async findPendingProfiles(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { verificationStatus: 'PENDING' } as const;

    const [items, totalItems] = await Promise.all([
      prisma.modelProfile.findMany({
        where,
        skip,
        take: limit,
        // `id` tiebreaker keeps the moderation queue stable across paginated fetches.
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          userId: true,
          displayName: true,
          city: true,
          birthDate: true,
          consentAt: true,
          photos: {
            select: { id: true, imageUrl: true, moderationStatus: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.modelProfile.count({ where }),
    ]);

    return { items, totalItems };
  },
};
