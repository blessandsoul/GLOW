'use client';

import { useQuery } from '@tanstack/react-query';
import { mastersService } from '../services/masters.service';
import type { FeaturedMaster } from '../types/masters.types';

export const mastersKeys = {
    all: ['masters'] as const,
    featured: (niche?: string) => [...mastersKeys.all, 'featured', niche ?? 'all'] as const,
    catalog: (filters: Record<string, unknown>) => [...mastersKeys.all, 'catalog', filters] as const,
};

export function useFeaturedMasters(niche?: string): {
    masters: FeaturedMaster[];
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
} {
    const { data: masters = [], isLoading, isError, isSuccess } = useQuery({
        queryKey: mastersKeys.featured(niche),
        queryFn: () => mastersService.getFeatured(12, niche || undefined),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
    });

    return { masters, isLoading, isError, isSuccess };
}
