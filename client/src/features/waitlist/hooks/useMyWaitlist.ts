'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { waitlistService } from '../services/waitlist.service';
import { waitlistKeys } from './useJoinWaitlist';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { WaitlistEntry, WaitlistDaySummary, WaitlistFilters, WaitlistStatus } from '../types/waitlist.types';

interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export function useMyWaitlist(filters: WaitlistFilters): {
    entries: WaitlistEntry[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
    isError: boolean;
} {
    const { data, isLoading, isError } = useQuery({
        queryKey: waitlistKeys.mine(filters as Record<string, unknown>),
        queryFn: () => waitlistService.getMine(filters),
        staleTime: 60 * 1000,
        placeholderData: keepPreviousData,
        retry: 1,
    });

    return {
        entries: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
        isError,
    };
}

export function useWaitlistSummary(): { summary: WaitlistDaySummary[]; isLoading: boolean } {
    const { data, isLoading } = useQuery({
        queryKey: waitlistKeys.summary(),
        queryFn: () => waitlistService.getSummary(),
        staleTime: 60 * 1000,
        retry: 1,
    });
    return { summary: data ?? [], isLoading };
}

export function useUpdateWaitlistStatus(): {
    updateStatus: (id: string, status: WaitlistStatus) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const mutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: WaitlistStatus }) =>
            waitlistService.updateStatus(id, status),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: waitlistKeys.all });
            toast.success(t('waitlist.status_updated'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        updateStatus: (id, status) => mutation.mutate({ id, status }),
        isPending: mutation.isPending,
    };
}
