import { prisma } from '@/libs/prisma.js';

const VERIFICATION_SELECT = {
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
  masterTier: true,
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
        rejectionReason: null,
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
      },
      select: VERIFICATION_SELECT,
    });
  },

  async updateIdDocument(userId: string, url: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { idDocumentUrl: url },
      select: VERIFICATION_SELECT,
    });
  },

  async updateCertificate(userId: string, url: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { certificateUrl: url },
      select: VERIFICATION_SELECT,
    });
  },

  async updateHygienePics(userId: string, urls: string[]) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { hygienePicsUrl: urls },
      select: VERIFICATION_SELECT,
    });
  },

  async updateQualityProductsPics(userId: string, urls: string[]) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { qualityProductsUrl: urls },
      select: VERIFICATION_SELECT,
    });
  },

  async approveVerification(userId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.masterProfile.update({
        where: { userId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: adminId,
          rejectionReason: null,
        },
        select: VERIFICATION_SELECT,
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: 'MASTER' },
      });

      return profile;
    });
  },

  async rejectVerification(userId: string, reason: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason,
      },
      select: VERIFICATION_SELECT,
    });
  },

  async setBadge(userId: string, badge: string, granted: boolean) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { [badge]: granted },
      select: VERIFICATION_SELECT,
    });
  },

  async findPendingVerifications(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.masterProfile.findMany({
        where: { verificationStatus: 'PENDING' },
        skip,
        take: limit,
        orderBy: { updatedAt: 'asc' },
        select: {
          ...VERIFICATION_SELECT,
          userId: true,
          city: true,
          niche: true,
          experienceYears: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phoneVerified: true,
            },
          },
        },
      }),
      prisma.masterProfile.count({ where: { verificationStatus: 'PENDING' } }),
    ]);

    const itemsWithPortfolioCount = await Promise.all(
      items.map(async (item) => {
        const portfolioCount = await prisma.portfolioItem.count({
          where: { userId: item.userId, isPublished: true },
        });
        return { ...item, portfolioCount };
      }),
    );

    return { items: itemsWithPortfolioCount, totalItems };
  },

  async findAllVerificationRequests(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status
      ? { verificationStatus: status }
      : { verificationStatus: { not: 'NONE' } };

    const [items, totalItems] = await Promise.all([
      prisma.masterProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          ...VERIFICATION_SELECT,
          userId: true,
          city: true,
          niche: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phoneVerified: true,
            },
          },
        },
      }),
      prisma.masterProfile.count({ where }),
    ]);

    return { items, totalItems };
  },

  async setTier(userId: string, tier: string, tierSortOrder: number) {
    return prisma.masterProfile.update({
      where: { userId },
      data: { masterTier: tier, tierSortOrder },
      select: VERIFICATION_SELECT,
    });
  },
};
