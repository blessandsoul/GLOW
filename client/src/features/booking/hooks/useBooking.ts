'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import type {
    PublicBookingInfo,
    SlotsResponse,
    RequestOtpPayload,
    BookPayload,
    BookResult,
} from '../types/booking.types';

export const bookingKeys = {
    all: ['booking'] as const,
    info: (username: string) => [...bookingKeys.all, 'info', username] as const,
    slots: (username: string, date: string, serviceName: string) =>
        [...bookingKeys.all, 'slots', username, date, serviceName] as const,
    mine: (filters: Record<string, unknown>) => [...bookingKeys.all, 'mine', filters] as const,
    settings: () => [...bookingKeys.all, 'settings'] as const,
};

export function useBookingInfo(username: string): {
    data: PublicBookingInfo | undefined;
    isLoading: boolean;
    isError: boolean;
} {
    const { data, isLoading, isError } = useQuery({
        queryKey: bookingKeys.info(username),
        queryFn: () => bookingService.getPublicInfo(username),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
    return { data, isLoading, isError };
}

export function useBookingSlots(
    username: string,
    date: string | null,
    serviceName: string | null,
): { data: SlotsResponse | undefined; isLoading: boolean; isFetching: boolean; isError: boolean } {
    const enabled = Boolean(username && date && serviceName);
    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey: bookingKeys.slots(username, date ?? '', serviceName ?? ''),
        queryFn: () => bookingService.getSlots(username, date as string, serviceName as string),
        enabled,
        staleTime: 30 * 1000,
        retry: 1,
    });
    return { data, isLoading: enabled && isLoading, isFetching, isError };
}

export function useBookingActions(username: string): {
    requestOtp: (payload: RequestOtpPayload) => Promise<{ requestId: string }>;
    book: (payload: BookPayload) => Promise<BookResult>;
    isRequestingOtp: boolean;
    isBooking: boolean;
} {
    const requestOtpMutation = useMutation({
        mutationFn: (payload: RequestOtpPayload) => bookingService.requestOtp(username, payload),
    });

    const bookMutation = useMutation({
        mutationFn: (payload: BookPayload) => bookingService.book(username, payload),
    });

    return {
        requestOtp: requestOtpMutation.mutateAsync,
        book: bookMutation.mutateAsync,
        isRequestingOtp: requestOtpMutation.isPending,
        isBooking: bookMutation.isPending,
    };
}
