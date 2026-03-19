import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse, PaginationParams } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
    FavoriteMasterItem,
    FavoritePortfolioItemItem,
    FavoriteStatusResponse,
} from '../types/favorites.types';

class FavoritesService {
    async getFavoriteMasters(params?: PaginationParams): Promise<{
        items: FavoriteMasterItem[];
        pagination: PaginatedApiResponse<FavoriteMasterItem>['data']['pagination'];
    }> {
        const { data: response } = await apiClient.get<PaginatedApiResponse<FavoriteMasterItem>>(
            API_ENDPOINTS.FAVORITES.MASTERS.LIST,
            { params },
        );
        return response.data;
    }

    async getFavoritePortfolioItems(params?: PaginationParams): Promise<{
        items: FavoritePortfolioItemItem[];
        pagination: PaginatedApiResponse<FavoritePortfolioItemItem>['data']['pagination'];
    }> {
        const { data: response } = await apiClient.get<PaginatedApiResponse<FavoritePortfolioItemItem>>(
            API_ENDPOINTS.FAVORITES.PORTFOLIO.LIST,
            { params },
        );
        return response.data;
    }

    async getFavoriteStatus(
        masterIds: string[],
        portfolioItemIds: string[],
    ): Promise<FavoriteStatusResponse> {
        const params = new URLSearchParams();
        masterIds.forEach((id) => params.append('masterIds', id));
        portfolioItemIds.forEach((id) => params.append('portfolioItemIds', id));

        const { data: response } = await apiClient.get<ApiResponse<FavoriteStatusResponse>>(
            `${API_ENDPOINTS.FAVORITES.STATUS}?${params.toString()}`,
        );
        return response.data;
    }

    async addFavoriteMaster(masterProfileId: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FAVORITES.MASTERS.ADD(masterProfileId));
    }

    async removeFavoriteMaster(masterProfileId: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.FAVORITES.MASTERS.REMOVE(masterProfileId));
    }

    async addFavoritePortfolioItem(portfolioItemId: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.FAVORITES.PORTFOLIO.ADD(portfolioItemId));
    }

    async removeFavoritePortfolioItem(portfolioItemId: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.FAVORITES.PORTFOLIO.REMOVE(portfolioItemId));
    }
}

export const favoritesService = new FavoritesService();
