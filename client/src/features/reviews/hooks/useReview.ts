'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { reviewService } from '../services/review.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { CreateReviewRequest, UpdateReviewRequest, Review } from '../types/review.types';

const reviewKeys = {
    all: ['reviews'] as const,
    myReview: (masterId: string) => [...reviewKeys.all, 'my', masterId] as const,
};

export function useMyReview(masterId: string | undefined, enabled: boolean): {
    myReview: Review | null | undefined;
    isLoading: boolean;
} {
    const { data: myReview, isLoading } = useQuery({
        queryKey: reviewKeys.myReview(masterId ?? ''),
        queryFn: () => reviewService.getMyReview(masterId!),
        enabled: enabled && !!masterId,
        staleTime: 5 * 60 * 1000,
    });

    return { myReview, isLoading };
}

export function useCreateReview(masterId: string): {
    createReview: (data: CreateReviewRequest) => void;
    isCreating: boolean;
} {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: CreateReviewRequest) => reviewService.createReview(data),
        onSuccess: () => {
            toast.success(t('portfolio.review_success'));
            queryClient.invalidateQueries({ queryKey: reviewKeys.myReview(masterId) });
            // Invalidate portfolio data to refresh review list and stats
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        createReview: mutation.mutate,
        isCreating: mutation.isPending,
    };
}

export function useUpdateReview(masterId: string): {
    updateReview: (params: { reviewId: string; data: UpdateReviewRequest }) => void;
    isUpdating: boolean;
} {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateReviewRequest }) =>
            reviewService.updateReview(reviewId, data),
        onSuccess: () => {
            toast.success(t('portfolio.review_updated'));
            queryClient.invalidateQueries({ queryKey: reviewKeys.myReview(masterId) });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        updateReview: mutation.mutate,
        isUpdating: mutation.isPending,
    };
}

export function useDeleteReview(masterId: string): {
    deleteReview: (reviewId: string) => void;
    isDeleting: boolean;
} {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (reviewId: string) => reviewService.deleteReview(reviewId),
        onSuccess: () => {
            toast.success(t('portfolio.review_deleted'));
            queryClient.invalidateQueries({ queryKey: reviewKeys.myReview(masterId) });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        deleteReview: mutation.mutate,
        isDeleting: mutation.isPending,
    };
}
