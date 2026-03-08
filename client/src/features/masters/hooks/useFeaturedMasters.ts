'use client';

import { useQuery } from '@tanstack/react-query';
import { mastersService } from '../services/masters.service';
import type { FeaturedMaster } from '../types/masters.types';

const mastersKeys = {
    all: ['masters'] as const,
    featured: () => [...mastersKeys.all, 'featured'] as const,
};

export function useFeaturedMasters(): {
    masters: FeaturedMaster[];
    isLoading: boolean;
    isError: boolean;
} {
    const { data: masters = [], isLoading, isError } = useQuery({
        queryKey: mastersKeys.featured(),
        queryFn: () => mastersService.getFeatured(12),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    return { masters, isLoading, isError };
}
