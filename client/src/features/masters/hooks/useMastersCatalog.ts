'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { mastersService } from '../services/masters.service';
import { mastersKeys } from './useFeaturedMasters';
import type { FeaturedMaster, CatalogFilters } from '../types/masters.types';

interface CatalogResult {
    masters: FeaturedMaster[];
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

export function useMastersCatalog(filters: CatalogFilters): CatalogResult {
    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey: mastersKeys.catalog(filters as Record<string, unknown>),
        queryFn: () => mastersService.getCatalog(filters),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: keepPreviousData,
        retry: 1,
    });

    return {
        masters: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
        isFetching,
        isError,
    };
}
