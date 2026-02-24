'use client';

import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/features/jobs/services/job.service';
import type { JobResultImage } from '../types/builder.types';

export function useJobResults(): {
    results: JobResultImage[];
    isLoading: boolean;
} {
    const { data, isLoading } = useQuery({
        queryKey: ['jobs', 'results'],
        queryFn: () => jobService.getResultImages(),
        staleTime: 2 * 60 * 1000,
    });

    return {
        results: data ?? [],
        isLoading,
    };
}
