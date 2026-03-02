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

export interface PublicReview {
    id: string;
    rating: number;
    text: string | null;
    clientName: string | null;
    createdAt: string;
}

export interface PublicPortfolioData {
    username: string;
    displayName: string;
    avatar: string | null;
    bio: string | null;
    instagram: string | null;
    whatsapp: string | null;
    telegram: string | null;
    city: string | null;
    niche: string | null;
    services: { name: string; price: number; priceType?: 'fixed' | 'hourly' }[];
    items: PortfolioItem[];
    reviews: PublicReview[];
    reviewsCount: number;
    averageRating: number;
}
