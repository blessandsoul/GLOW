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
};
