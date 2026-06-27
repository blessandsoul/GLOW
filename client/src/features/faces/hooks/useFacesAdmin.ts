'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { facesService } from '../services/faces.service';
import { facesKeys } from './useFacesCatalog';
import { getErrorMessage } from '@/lib/utils/error';
import type { PendingModel } from '../types/faces.types';

const adminPendingKey = (): readonly unknown[] => [...facesKeys.all, 'admin', 'pending'];

export function useFacesAdminPending(): { pending: PendingModel[]; isLoading: boolean; isError: boolean } {
    const { data, isLoading, isError } = useQuery({
        queryKey: adminPendingKey(),
        queryFn: () => facesService.adminGetPending(1, 50),
        staleTime: 30 * 1000,
        retry: 1,
    });
    return { pending: data?.items ?? [], isLoading, isError };
}

export function useFacesAdminReview(): {
    approve: (userId: string) => void;
    reject: (userId: string, reason: string) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ userId, action, reason }: { userId: string; action: 'approve' | 'reject'; reason?: string }) =>
            facesService.adminReview(userId, action, reason),
        onSuccess: (_d, vars) => {
            void queryClient.invalidateQueries({ queryKey: facesKeys.all });
            toast.success(vars.action === 'approve' ? 'მოდელი დამტკიცდა' : 'მოდელი უარყოფილია');
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });

    return {
        approve: (userId) => mutation.mutate({ userId, action: 'approve' }),
        reject: (userId, reason) => mutation.mutate({ userId, action: 'reject', reason }),
        isPending: mutation.isPending,
    };
}
