'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { adminService } from '../services/admin.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { AdminUser, AdminStats } from '../types/admin.types';
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
