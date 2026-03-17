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
  language?: string;
  locationType?: string;
  district?: string;
  brandSlug?: string;
  styleTagSlug?: string;
  bounds?: { swLat: number; swLng: number; neLat: number; neLng: number };
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
      services: true,
      languages: true,
      locationType: true,
      workingHours: true,
      latitude: true,
      longitude: true,
      isManualLocation: true,
      verificationStatus: true,
      isCertified: true,
      isHygieneVerified: true,
      isQualityProducts: true,
      isTopRated: true,
      experienceYears: true,
      district: {
        select: { name: true, slug: true, latitude: true, longitude: true },
      },
      brands: {
        select: { brand: { select: { name: true, slug: true, logoUrl: true } } },
      },
      styleTags: {
        select: { styleTag: { select: { name: true, slug: true } } },
      },
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
  language?: string;
  locationType?: string;
  district?: string;
  brandSlug?: string;
  styleTagSlug?: string;
  bounds?: { swLat: number; swLng: number; neLat: number; neLng: number };
}): Prisma.UserWhereInput {
  const profileConditions: Record<string, unknown> = {};
  if (opts?.niche) profileConditions.niche = opts.niche;
  if (opts?.city) {
    const cities = opts.city.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
    profileConditions.city = cities.length === 1 ? cities[0] : { in: cities };
  }
  if (opts?.isVerified) profileConditions.verificationStatus = 'VERIFIED';
  if (opts?.isCertified) profileConditions.isCertified = true;
  if (opts?.isHygieneVerified) profileConditions.isHygieneVerified = true;
  if (opts?.isQualityProducts) profileConditions.isQualityProducts = true;
  if (opts?.isTopRated) profileConditions.isTopRated = true;
  if (opts?.locationType) profileConditions.locationType = opts.locationType;
  if (opts?.language) profileConditions.languages = { array_contains: opts.language };
  if (opts?.district) profileConditions.district = { is: { slug: opts.district } };
  if (opts?.brandSlug) profileConditions.brands = { some: { brand: { slug: opts.brandSlug } } };
  if (opts?.styleTagSlug) profileConditions.styleTags = { some: { styleTag: { slug: opts.styleTagSlug } } };
  if (opts?.bounds) {
    profileConditions.latitude = { gte: opts.bounds.swLat, lte: opts.bounds.neLat };
    profileConditions.longitude = { gte: opts.bounds.swLng, lte: opts.bounds.neLng };
  }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMaster(m: any) {
  const p = m.masterProfile;
  return {
    username: m.username!,
    displayName: m.brandingProfile?.displayName ?? `${m.firstName} ${m.lastName}`,
    avatar: m.avatar,
    city: p?.city ?? null,
    niche: p?.niche ?? null,
    isVerified: p?.verificationStatus === 'VERIFIED',
    badges: {
      isCertified: p?.isCertified ?? false,
      isHygieneVerified: p?.isHygieneVerified ?? false,
      isQualityProducts: p?.isQualityProducts ?? false,
      isTopRated: p?.isTopRated ?? false,
    },
    experienceYears: p?.experienceYears ?? null,
    services: p?.services ?? null,
    languages: (p?.languages as string[] | null) ?? [],
    locationType: p?.locationType ?? null,
    workingHours: p?.workingHours ?? null,
    district: p?.district ?? null,
    latitude: p?.latitude ?? p?.district?.latitude ?? null,
    longitude: p?.longitude ?? p?.district?.longitude ?? null,
    isManualLocation: p?.isManualLocation ?? false,
    brands: (p?.brands ?? []).map((mb: { brand: { name: string; slug: string; logoUrl: string | null } }) => mb.brand),
    styleTags: (p?.styleTags ?? []).map((mt: { styleTag: { name: string; slug: string } }) => mt.styleTag),
    portfolioImages: m.portfolioItems.map((item: { id: string; imageUrl: string; title: string | null }) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
    })),
    totalItems: m._count.portfolioItems,
  };
}

export const mastersRepo = {
  /**
   * Count active masters (with published portfolio) grouped by niche.
   */
  async countByNiche(): Promise<{ niche: string; count: number }[]> {
    const results = await prisma.masterProfile.groupBy({
      by: ['niche'],
      where: {
        niche: { not: null },
        user: {
          isActive: true,
          deletedAt: null,
          username: { not: null },
          portfolioItems: { some: { isPublished: true } },
        },
      },
      _count: { niche: true },
    });

    return results
      .filter((r) => r.niche !== null)
      .map((r) => ({ niche: r.niche!, count: r._count.niche }));
  },

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
    const { niche, city, search, page, limit, isVerified, isCertified, isHygieneVerified, isQualityProducts, isTopRated, language, locationType, district, brandSlug, styleTagSlug, bounds } = filters;
    const offset = (page - 1) * limit;
    const where = buildWhere({ niche, city, search, isVerified, isCertified, isHygieneVerified, isQualityProducts, isTopRated, language, locationType, district, brandSlug, styleTagSlug, bounds });

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
