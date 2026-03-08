export interface FeaturedMasterImage {
    id: string;
    imageUrl: string;
    title: string | null;
}

export interface FeaturedMaster {
    username: string;
    displayName: string;
    avatar: string | null;
    city: string | null;
    niche: string | null;
    portfolioImages: FeaturedMasterImage[];
    totalItems: number;
}
