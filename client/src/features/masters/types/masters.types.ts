export type MasterTier = 'JUNIOR' | 'INTERMEDIATE' | 'PROFESSIONAL' | 'TOP_MASTER';

export interface FeaturedMasterImage {
    id: string;
    imageUrl: string;
    title: string | null;
}

export interface MasterBadges {
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    isTopRated: boolean;
}

export interface MasterServiceItem {
    name: string;
    price: number;
    priceType: 'fixed' | 'hourly';
    category: string;
    duration?: number;
    description?: string;
}

export interface MasterDistrict {
    name: string;
    slug: string;
}

export interface MasterBrand {
    name: string;
    slug: string;
    logoUrl: string | null;
}

export interface MasterStyleTag {
    name: string;
    slug: string;
}

export type LocationType = 'salon' | 'home_studio' | 'mobile' | 'client_visit';

export interface FeaturedMaster {
    masterProfileId: string | null;
    username: string;
    displayName: string;
    avatar: string | null;
    city: string | null;
    niche: string | null;
    portfolioImages: FeaturedMasterImage[];
    totalItems: number;
    favoritesCount?: number;
    masterTier?: MasterTier;
    isVerified?: boolean;
    badges?: MasterBadges;
    experienceYears?: number | null;
    services?: MasterServiceItem[] | null;
    languages?: string[];
    locationType?: LocationType | null;
    workingHours?: Record<string, { open: string; close: string }[] | null> | null;
    district?: MasterDistrict | null;
    brands?: MasterBrand[];
    styleTags?: MasterStyleTag[];
    latitude?: number | null;
    longitude?: number | null;
    isManualLocation?: boolean;
}

export interface CatalogFilters {
    niche?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
    isVerified?: boolean;
    isCertified?: boolean;
    isHygieneVerified?: boolean;
    isQualityProducts?: boolean;
    isTopRated?: boolean;
    masterTier?: string;
    language?: string;
    locationType?: LocationType;
    district?: string;
    brandSlug?: string;
    styleTagSlug?: string;
    swLat?: number;
    swLng?: number;
    neLat?: number;
    neLng?: number;
}

export interface CatalogDistrict {
    id: string;
    name: string;
    slug: string;
    citySlug: string;
}

export interface CatalogBrand {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

export interface CatalogStyleTag {
    id: string;
    name: string;
    slug: string;
    niche: string | null;
}

export interface MapBounds {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
}
