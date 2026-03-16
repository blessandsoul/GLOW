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

export interface FeaturedMaster {
    username: string;
    displayName: string;
    avatar: string | null;
    city: string | null;
    niche: string | null;
    portfolioImages: FeaturedMasterImage[];
    totalItems: number;
    isVerified?: boolean;
    badges?: MasterBadges;
    experienceYears?: number | null;
}

export interface CatalogFilters {
    niche?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
}
