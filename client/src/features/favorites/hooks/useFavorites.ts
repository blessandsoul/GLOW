'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import { favoritesService } from '../services/favorites.service';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getErrorMessage } from '@/lib/utils/error';
import type { FavoriteMasterItem, FavoritePortfolioItemItem, FavoriteStatusResponse } from '../types/favorites.types';
import type { PaginationMeta } from '@/lib/api/api.types';

export const favoriteKeys = {
    all: ['favorites'] as const,
    masters: () => [...favoriteKeys.all, 'masters'] as const,
    mastersList: (page: number, limit: number) => [...favoriteKeys.masters(), 'list', { page, limit }] as const,
    portfolio: () => [...favoriteKeys.all, 'portfolio'] as const,
    portfolioList: (page: number, limit: number) => [...favoriteKeys.portfolio(), 'list', { page, limit }] as const,
    status: (masterIds: string[], portfolioItemIds: string[]) =>
        [...favoriteKeys.all, 'status', { masterIds, portfolioItemIds }] as const,
};

export function useFavoriteMasters(page: number = 1, limit: number = 10): {
    items: FavoriteMasterItem[] | undefined;
    pagination: PaginationMeta | undefined;
    isLoading: boolean;
} {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    const { data, isLoading } = useQuery({
        queryKey: favoriteKeys.mastersList(page, limit),
        queryFn: () => favoritesService.getFavoriteMasters({ page, limit }),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });

    return { items: data?.items, pagination: data?.pagination, isLoading };
}

export function useFavoritePortfolioItems(page: number = 1, limit: number = 10): {
    items: FavoritePortfolioItemItem[] | undefined;
    pagination: PaginationMeta | undefined;
    isLoading: boolean;
} {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    const { data, isLoading } = useQuery({
        queryKey: favoriteKeys.portfolioList(page, limit),
        queryFn: () => favoritesService.getFavoritePortfolioItems({ page, limit }),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });

    return { items: data?.items, pagination: data?.pagination, isLoading };
}

export function useFavoriteStatus(masterIds: string[], portfolioItemIds: string[]): {
    status: FavoriteStatusResponse | undefined;
    isLoading: boolean;
} {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const enabled = isAuthenticated && (masterIds.length > 0 || portfolioItemIds.length > 0);

    const { data: status, isLoading } = useQuery({
        queryKey: favoriteKeys.status(masterIds, portfolioItemIds),
        queryFn: () => favoritesService.getFavoriteStatus(masterIds, portfolioItemIds),
        enabled,
        staleTime: 5 * 60 * 1000,
    });

    return { status, isLoading };
}

export function useFavoriteToggle(): {
    toggleMaster: (params: { masterProfileId: string; isFavorited: boolean }) => void;
    togglePortfolioItem: (params: { portfolioItemId: string; isFavorited: boolean }) => void;
    isTogglingMaster: boolean;
    isTogglingPortfolioItem: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const masterMutation = useMutation({
        mutationFn: ({ masterProfileId, isFavorited }: { masterProfileId: string; isFavorited: boolean }) =>
            isFavorited
                ? favoritesService.removeFavoriteMaster(masterProfileId)
                : favoritesService.addFavoriteMaster(masterProfileId),
        onSuccess: (_data, { isFavorited }) => {
            toast.success(isFavorited ? t('favorites.removed') : t('favorites.added'));
            queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    const portfolioMutation = useMutation({
        mutationFn: ({ portfolioItemId, isFavorited }: { portfolioItemId: string; isFavorited: boolean }) =>
            isFavorited
                ? favoritesService.removeFavoritePortfolioItem(portfolioItemId)
                : favoritesService.addFavoritePortfolioItem(portfolioItemId),
        onSuccess: (_data, { isFavorited }) => {
            toast.success(isFavorited ? t('favorites.removed') : t('favorites.added'));
            queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        toggleMaster: masterMutation.mutate,
        togglePortfolioItem: portfolioMutation.mutate,
        isTogglingMaster: masterMutation.isPending,
        isTogglingPortfolioItem: portfolioMutation.isPending,
    };
}
