'use client';

import { useQuery } from '@tanstack/react-query';
import { mastersService } from '../services/masters.service';

export function useNicheCounts(): {
    counts: Record<string, number>;
    isLoading: boolean;
} {
    const { data, isLoading } = useQuery({
        queryKey: ['masters', 'niche-counts'],
        queryFn: () => mastersService.getNicheCounts(),
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
    });

    const counts: Record<string, number> = {};
    if (data) {
        for (const item of data) {
            counts[item.niche] = item.count;
        }
    }

    return { counts, isLoading };
}
