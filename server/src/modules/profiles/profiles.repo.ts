import { prisma } from '@/libs/prisma.js';
import type { UpdateProfileInput } from './profiles.schemas.js';

const PROFILE_SELECT = {
  id: true,
  userId: true,
  city: true,
  niche: true,
  workAddress: true,
  bio: true,
  phone: true,
  whatsapp: true,
  telegram: true,
  instagram: true,
  services: true,
  languages: true,
  locationType: true,
  districtId: true,
  workingHours: true,
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
  district: {
    select: { id: true, name: true, slug: true, citySlug: true },
  },
  brands: {
    select: { brand: { select: { id: true, name: true, slug: true, logoUrl: true } } },
  },
  styleTags: {
    select: { styleTag: { select: { id: true, name: true, slug: true, niche: true } } },
  },
} as const;

export const profilesRepo = {
  async findByUserId(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });
  },

  async upsert(userId: string, data: UpdateProfileInput) {
    const { brandIds, styleTagIds, ...profileData } = data;

    // Get existing profile id for M2M updates
    const existing = await prisma.masterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const profileId = existing?.id;

    const result = await prisma.masterProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...profileData,
      },
      update: profileData,
      select: PROFILE_SELECT,
    });

    const currentProfileId = profileId ?? result.id;

    // Update M2M: brands
    if (brandIds !== undefined) {
      await prisma.masterBrand.deleteMany({ where: { masterProfileId: currentProfileId } });
      if (brandIds.length > 0) {
        await prisma.masterBrand.createMany({
          data: brandIds.map((brandId) => ({ masterProfileId: currentProfileId, brandId })),
        });
      }
    }

    // Update M2M: style tags
    if (styleTagIds !== undefined) {
      await prisma.masterStyleTag.deleteMany({ where: { masterProfileId: currentProfileId } });
      if (styleTagIds.length > 0) {
        await prisma.masterStyleTag.createMany({
          data: styleTagIds.map((styleTagId) => ({ masterProfileId: currentProfileId, styleTagId })),
        });
      }
    }

    // Re-fetch with M2M data if updated
    if (brandIds !== undefined || styleTagIds !== undefined) {
      return prisma.masterProfile.findUnique({
        where: { userId },
        select: PROFILE_SELECT,
      });
    }

    return result;
  },
};
