import { prisma } from '@/libs/prisma.js';

export const mastersRepo = {
  /**
   * Find active masters who have at least 1 published portfolio item.
   * Returns master data with their top 4 portfolio images.
   * Orders by most recently active (latest portfolio item).
   */
  async findFeaturedMasters(limit: number = 12) {
    const masters = await prisma.user.findMany({
      where: {
        role: 'MASTER',
        isActive: true,
        deletedAt: null,
        username: { not: null },
        portfolioItems: {
          some: { isPublished: true },
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        masterProfile: {
          select: {
            city: true,
            niche: true,
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
          orderBy: { sortOrder: 'asc' },
          take: 4,
        },
        _count: {
          select: {
            portfolioItems: {
              where: { isPublished: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return masters.map((m) => ({
      username: m.username!,
      displayName: m.brandingProfile?.displayName ?? `${m.firstName} ${m.lastName}`,
      avatar: m.avatar,
      city: m.masterProfile?.city ?? null,
      niche: m.masterProfile?.niche ?? null,
      portfolioImages: m.portfolioItems.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        title: item.title,
      })),
      totalItems: m._count.portfolioItems,
    }));
  },
};
