import type { PaginationParams } from '@/lib/api/api.types';

export interface FavoriteMasterItem {
    id: string;
    createdAt: string;
    masterProfile: {
        id: string;
        city: string | null;
        niche: string | null;
        verificationStatus: string;
        isCertified: boolean;
        user: {
            username: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        _count: {
            favoritedBy: number;
        };
    };
}

export interface FavoritePortfolioItemItem {
    id: string;
    createdAt: string;
    portfolioItem: {
        id: string;
        imageUrl: string;
        title: string | null;
        niche: string | null;
        createdAt: string;
        user: {
            username: string;
            firstName: string;
            lastName: string;
        };
        _count: {
            favoritedBy: number;
        };
    };
}

export interface FavoriteStatusResponse {
    masters: Record<string, boolean>;
    portfolioItems: Record<string, boolean>;
}

export type FavoriteTab = 'masters' | 'portfolio';

export interface FavoritesListParams extends PaginationParams {}
