import { prisma } from '@/libs/prisma.js';

export const catalogRepo = {
  async findActiveSpecialities() {
    return prisma.speciality.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, label: true },
    });
  },

  async findActiveServiceCategories() {
    return prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        slug: true,
        label: true,
        icon: true,
        suggestions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { name: true },
        },
      },
    });
  },

  async findActiveDistricts(citySlug?: string) {
    return prisma.district.findMany({
      where: { isActive: true, ...(citySlug ? { citySlug } : {}) },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, citySlug: true },
    });
  },

  async findActiveBrands() {
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  },

  async findActiveStyleTags(niche?: string) {
    return prisma.styleTag.findMany({
      where: { isActive: true, ...(niche ? { niche } : {}) },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, niche: true },
    });
  },
};
