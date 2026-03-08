'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { adminService } from '../services/admin.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { AdminUser, AdminStats, AdminUserImage, AdminPortfolioUser, AdminPortfolioItem, DecorationPoolStatus } from '../types/admin.types';
import type { PaginationMeta } from '@/lib/api/api.types';

export function useAdminUsers(
    page: number,
    limit: number,
    search?: string,
): {
    users: AdminUser[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'users', { page, limit, search }],
        queryFn: () => adminService.getUsers({ page, limit, search }),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        users: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useAdminStats(): {
    stats: AdminStats | undefined;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: () => adminService.getStats(),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { stats: data, isLoading };
}

export function useAdminUserImages(
    userId: string | null,
    page: number = 1,
    limit: number = 12,
): {
    images: AdminUserImage[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'user-images', userId, { page, limit }],
        queryFn: () => adminService.getUserImages(userId!, { page, limit }),
        enabled: !!userId,
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        images: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useFlushDailyLimits(): {
    flush: () => void;
    isPending: boolean;
} {
    const { mutate, isPending } = useMutation({
        mutationFn: () => adminService.flushDailyLimits(),
        onSuccess: () => {
            toast.success('Your daily limit has been reset');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { flush: mutate, isPending };
}

export function useAdminPortfolioUsers(
    page: number,
    limit: number,
    search?: string,
): {
    users: AdminPortfolioUser[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'portfolios', { page, limit, search }],
        queryFn: () => adminService.getPortfolioUsers({ page, limit, search }),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        users: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useAdminPortfolioItems(
    userId: string | null,
    page: number = 1,
    limit: number = 12,
): {
    items: AdminPortfolioItem[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'portfolio-items', userId, { page, limit }],
        queryFn: () => adminService.getPortfolioItems(userId!, { page, limit }),
        enabled: !!userId,
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        items: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useDecorationPoolStatus(): {
    pool: DecorationPoolStatus | undefined;
    isLoading: boolean;
    refetch: () => void;
} {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['admin', 'decoration-pool'],
        queryFn: () => adminService.getDecorationPoolStatus(),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { pool: data, isLoading, refetch };
}

export function useReplenishDecorationPool(): {
    replenish: () => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: () => adminService.replenishDecorationPool(),
        onSuccess: () => {
            toast.success('Decoration pool replenishment started');
            // Refetch pool status after a short delay to show updated counts
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'decoration-pool'] });
            }, 3000);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { replenish: mutate, isPending };
}
