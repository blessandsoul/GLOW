import { prisma } from '@/libs/prisma.js';
import type { UpdateBrandingInput } from './branding.schemas.js';

const BRANDING_SELECT = {
  id: true,
  userId: true,
  displayName: true,
  instagramHandle: true,
  facebookHandle: true,
  tiktokHandle: true,
  logoUrl: true,
  primaryColor: true,
  watermarkStyle: true,
  watermarkOpacity: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const brandingRepo = {
  async findByUserId(userId: string) {
    return prisma.brandingProfile.findUnique({
      where: { userId },
      select: BRANDING_SELECT,
    });
  },

  async upsert(userId: string, data: UpdateBrandingInput & { logoUrl?: string }) {
    return prisma.brandingProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
      select: BRANDING_SELECT,
    });
  },

  async updateLogoUrl(userId: string, logoUrl: string | null) {
    return prisma.brandingProfile.update({
      where: { userId },
      data: { logoUrl },
      select: BRANDING_SELECT,
    });
  },

  async deleteByUserId(userId: string) {
    return prisma.brandingProfile.delete({
      where: { userId },
    });
  },
};
