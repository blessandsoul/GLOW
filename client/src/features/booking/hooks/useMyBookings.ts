'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingService } from '../services/booking.service';
import { bookingKeys } from './useBooking';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { MasterBooking, BookingFilters, BookingStatus } from '../types/booking.types';

interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export function useMyBookings(filters: BookingFilters): {
    bookings: MasterBooking[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
    isError: boolean;
} {
    const { data, isLoading, isError } = useQuery({
        queryKey: bookingKeys.mine(filters as Record<string, unknown>),
        queryFn: () => bookingService.getMine(filters),
        staleTime: 60 * 1000,
        placeholderData: keepPreviousData,
        retry: 1,
    });

    return {
        bookings: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
        isError,
    };
}

export function useUpdateBookingStatus(): {
    updateStatus: (id: string, status: BookingStatus) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const mutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
            bookingService.updateStatus(id, status),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
            toast.success(t('booking.status_updated'));
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

export function useMarkDepositReceived(): {
    markReceived: (id: string) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const mutation = useMutation({
        mutationFn: (id: string) => bookingService.markDepositReceived(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
            toast.success(t('booking.deposit_marked'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        markReceived: (id) => mutation.mutate(id),
        isPending: mutation.isPending,
    };
}
