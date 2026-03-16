import { prisma } from '@/libs/prisma.js';
import type { Prisma } from '@prisma/client';

export interface CatalogFilters {
  niche?: string;
  city?: string;
  search?: string;
  page: number;
  limit: number;
  isVerified?: boolean;
  isCertified?: boolean;
  isHygieneVerified?: boolean;
  isQualityProducts?: boolean;
  isTopRated?: boolean;
}

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
      experienceYears: true,
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

function buildWhere(opts?: {
  niche?: string;
  city?: string;
  search?: string;
  isVerified?: boolean;
  isCertified?: boolean;
  isHygieneVerified?: boolean;
  isQualityProducts?: boolean;
  isTopRated?: boolean;
}): Prisma.UserWhereInput {
  const profileConditions: Record<string, unknown> = {};
  if (opts?.niche) profileConditions.niche = opts.niche;
  if (opts?.city) profileConditions.city = { contains: opts.city };
  if (opts?.isVerified) profileConditions.verificationStatus = 'VERIFIED';
  if (opts?.isCertified) profileConditions.isCertified = true;
  if (opts?.isHygieneVerified) profileConditions.isHygieneVerified = true;
  if (opts?.isQualityProducts) profileConditions.isQualityProducts = true;
  if (opts?.isTopRated) profileConditions.isTopRated = true;

  const masterProfileFilter: Prisma.MasterProfileNullableScalarRelationFilter = Object.keys(profileConditions).length > 0
    ? { is: profileConditions }
    : { isNot: null };

  const where: Prisma.UserWhereInput = {
    isActive: true,
    deletedAt: null,
    username: { not: null },
    masterProfile: masterProfileFilter,
    portfolioItems: {
      some: { isPublished: true },
    },
  };

  if (opts?.search) {
    where.OR = [
      { firstName: { contains: opts.search } },
      { lastName: { contains: opts.search } },
      { brandingProfile: { displayName: { contains: opts.search } } },
    ];
  }

  return where;
}

function mapMaster(m: {
  username: string | null;
  firstName: string;
  lastName: string;
  avatar: string | null;
  masterProfile: {
    city: string | null;
    niche: string | null;
    verificationStatus: string;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    isTopRated: boolean;
    experienceYears: number | null;
  } | null;
  brandingProfile: { displayName: string | null } | null;
  portfolioItems: { id: string; imageUrl: string; title: string | null }[];
  _count: { portfolioItems: number };
}) {
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
    experienceYears: m.masterProfile?.experienceYears ?? null,
    portfolioImages: m.portfolioItems.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
    })),
    totalItems: m._count.portfolioItems,
  };
}

export const mastersRepo = {
  /**
   * Find active masters who have at least 1 published portfolio item.
   * Returns master data with their top 4 portfolio images.
   * Optionally filters by niche (speciality).
   */
  async findFeaturedMasters(limit: number = 12, niche?: string) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      deletedAt: null,
      username: { not: null },
      masterProfile: {
        is: {
          verificationStatus: 'VERIFIED',
          ...(niche ? { niche } : {}),
        },
      },
      portfolioItems: {
        some: { isPublished: true },
      },
    };

    const masters = await prisma.user.findMany({
      where,
      select: MASTER_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return masters.map(mapMaster);
  },

  /**
   * Find masters for the public catalog with search, filters, and pagination.
   */
  async findCatalogMasters(filters: CatalogFilters) {
    const { niche, city, search, page, limit, isVerified, isCertified, isHygieneVerified, isQualityProducts, isTopRated } = filters;
    const offset = (page - 1) * limit;
    const where = buildWhere({ niche, city, search, isVerified, isCertified, isHygieneVerified, isQualityProducts, isTopRated });

    const [masters, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        select: MASTER_SELECT,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: masters.map(mapMaster),
      totalItems,
    };
  },
};
