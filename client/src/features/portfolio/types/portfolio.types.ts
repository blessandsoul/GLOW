export interface PortfolioItem {
    id: string;
    userId: string;
    jobId: string | null;
    imageUrl: string;
    title: string | null;
    niche: string | null;
    isPublished: boolean;
    sortOrder: number;
    createdAt: string;
}

export interface PortfolioItemFormData {
    imageUrl: string;
    title: string;
    niche: string;
    isPublished: boolean;
    jobId?: string;
}

export interface PublicPortfolioData {
    username: string;
    displayName: string;
    bio: string | null;
    instagram: string | null;
    city: string | null;
    niche: string | null;
    services: { name: string; price: number; currency: string }[];
    items: PortfolioItem[];
    reviewsCount: number;
    averageRating: number;
}
