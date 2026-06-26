'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { facesService } from '../services/faces.service';
import type { ModelCard, ModelDetail, FacesCatalogFilters } from '../types/faces.types';

export const facesKeys = {
    all: ['faces'] as const,
    catalog: (filters: Record<string, unknown>) => [...facesKeys.all, 'catalog', filters] as const,
    detail: (id: string) => [...facesKeys.all, 'detail', id] as const,
    me: () => [...facesKeys.all, 'me'] as const,
    interestStatus: (ids: string[]) => [...facesKeys.all, 'interest', ids] as const,
};

interface CatalogResult {
    models: ModelCard[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    } | null;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
}

export function useFacesCatalog(filters: FacesCatalogFilters): CatalogResult {
    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey: facesKeys.catalog(filters as Record<string, unknown>),
        queryFn: () => facesService.getCatalog(filters),
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
        retry: 1,
    });

    return {
        models: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
        isFetching,
        isError,
    };
}

export function useFaceDetail(id: string): { model: ModelDetail | undefined; isLoading: boolean; isError: boolean } {
    const { data, isLoading, isError } = useQuery({
        queryKey: facesKeys.detail(id),
        queryFn: () => facesService.getDetail(id),
        retry: 1,
    });
    return { model: data, isLoading, isError };
}
