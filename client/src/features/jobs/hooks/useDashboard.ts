'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { jobService } from '../services/job.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { DashboardStats, Job, JobStatus } from '../types/job.types';

export function useDashboardStats(): { data: DashboardStats | undefined; isLoading: boolean } {
    const { data, isLoading } = useQuery<DashboardStats>({
        queryKey: ['jobs', 'stats'],
        queryFn: () => jobService.getStats(),
    });

    return { data, isLoading };
}

export function useDashboardGallery(filters: { status?: JobStatus; limit?: number } = {}): {
    jobs: Job[];
    total: number;
    isLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
} {
    const { limit = 20, status } = filters;

    const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: ['jobs', 'gallery', { limit, status }],
        queryFn: ({ pageParam }: { pageParam: number }) =>
            jobService.getUserJobs(pageParam, limit, status ? { status } : undefined),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        maxPages: 5,
        gcTime: 3 * 60 * 1000,
    });

    const jobs = useMemo(
        () => data?.pages.flatMap((p) => p.items) ?? [],
        [data],
    );
    const total = data?.pages[0]?.total ?? 0;

    return { jobs, total, isLoading, hasNextPage: hasNextPage ?? false, isFetchingNextPage, fetchNextPage };
}

export function useDeleteJob(): {
    mutate: (id: string) => void;
    isPending: boolean;
} {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation<void, unknown, string>({
        mutationFn: (id: string) => jobService.deleteJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast.success(t('dashboard.deleted_success'));
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { mutate, isPending };
}

export function useBulkDeleteJobs(): {
    mutate: (jobIds: string[]) => void;
    isPending: boolean;
} {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation<{ deleted: number }, unknown, string[]>({
        mutationFn: (jobIds: string[]) => jobService.bulkDeleteJobs(jobIds),
        onSuccess: (data: { deleted: number }) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast.success(`${data.deleted} ${t('dashboard.bulk_deleted_success')}`);
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { mutate, isPending };
}
