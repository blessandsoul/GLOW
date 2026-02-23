import { prisma } from '@/libs/prisma.js';
import type { UpdateProfileInput } from './profiles.schemas.js';

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
  createdAt: true,
  updatedAt: true,
} as const;

export const profilesRepo = {
  async findByUserId(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });
  },

  async upsert(userId: string, data: UpdateProfileInput) {
    return prisma.masterProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
      select: PROFILE_SELECT,
    });
  },
};
