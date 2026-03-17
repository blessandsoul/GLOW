import { prisma } from '@/libs/prisma.js';
import { USER_SELECT } from '@/modules/auth/auth.repo.js';
import type { Prisma } from '@prisma/client';

export const onboardingRepo = {
  async completeAsUser(
    userId: string,
    metadata: Record<string, unknown>,
    consents: { smsAppointments: boolean; smsPromotions: boolean; smsNews: boolean },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        role: 'USER',
        onboardingCompleted: true,
        metadata: {
          ...metadata,
          consents,
        },
      },
      select: USER_SELECT,
    });
  },

  async completeAsMaster(
    userId: string,
    profileData: {
      city: string;
      workAddress: string;
      latitude?: number | null;
      longitude?: number | null;
      niche: string;
      experienceYears: number;
      services: Array<{
        name: string;
        price: number;
        priceType: string;
        category: string;
        duration?: number;
        description?: string;
      }>;
    },
    consents: { smsAppointments: boolean; smsPromotions: boolean; smsNews: boolean },
  ) {
    return prisma.$transaction(async (tx) => {
      // Update user role and onboarding flag
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: 'MASTER',
          onboardingCompleted: true,
          metadata: { consents },
        },
        select: USER_SELECT,
      });

      // Upsert master profile
      await tx.masterProfile.upsert({
        where: { userId },
        create: {
          userId,
          city: profileData.city,
          workAddress: profileData.workAddress,
          latitude: profileData.latitude ?? null,
          longitude: profileData.longitude ?? null,
          niche: profileData.niche,
          experienceYears: profileData.experienceYears,
          services: profileData.services as unknown as Prisma.InputJsonValue,
        },
        update: {
          city: profileData.city,
          workAddress: profileData.workAddress,
          latitude: profileData.latitude ?? null,
          longitude: profileData.longitude ?? null,
          niche: profileData.niche,
          experienceYears: profileData.experienceYears,
          services: profileData.services as unknown as Prisma.InputJsonValue,
        },
      });

      return user;
    });
  },

  async completeAsSalon(
    userId: string,
    profileData: {
      salonName: string;
      city: string;
      workAddress: string;
      latitude?: number | null;
      longitude?: number | null;
      serviceCategories: string[];
    },
    consents: { smsAppointments: boolean; smsPromotions: boolean; smsNews: boolean },
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: 'SALON',
          onboardingCompleted: true,
          metadata: { consents, serviceCategories: profileData.serviceCategories },
        },
        select: USER_SELECT,
      });

      // Upsert master profile (reused for salons)
      await tx.masterProfile.upsert({
        where: { userId },
        create: {
          userId,
          city: profileData.city,
          niche: profileData.salonName,
          workAddress: profileData.workAddress,
          latitude: profileData.latitude ?? null,
          longitude: profileData.longitude ?? null,
        },
        update: {
          city: profileData.city,
          niche: profileData.salonName,
          workAddress: profileData.workAddress,
          latitude: profileData.latitude ?? null,
          longitude: profileData.longitude ?? null,
        },
      });

      return user;
    });
  },

  async isOnboardingCompleted(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });
    return user?.onboardingCompleted ?? false;
  },
};
