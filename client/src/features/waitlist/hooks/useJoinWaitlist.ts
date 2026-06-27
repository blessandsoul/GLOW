'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { waitlistService } from '../services/waitlist.service';
import type { JoinPayload, RequestOtpPayload, PublicMasterServices, WaitlistJoinResult } from '../types/waitlist.types';

export const waitlistKeys = {
    all: ['waitlist'] as const,
    services: (username: string) => [...waitlistKeys.all, 'services', username] as const,
    mine: (filters: Record<string, unknown>) => [...waitlistKeys.all, 'mine', filters] as const,
    summary: () => [...waitlistKeys.all, 'summary'] as const,
};

export function useWaitlistServices(username: string): {
    data: PublicMasterServices | undefined;
    isLoading: boolean;
    isError: boolean;
} {
    const { data, isLoading, isError } = useQuery({
        queryKey: waitlistKeys.services(username),
        queryFn: () => waitlistService.getPublicServices(username),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
    return { data, isLoading, isError };
}

export function useJoinWaitlist(username: string): {
    requestOtp: (payload: RequestOtpPayload) => Promise<{ requestId: string }>;
    join: (payload: JoinPayload) => Promise<WaitlistJoinResult>;
    isRequestingOtp: boolean;
    isJoining: boolean;
} {
    const requestOtpMutation = useMutation({
        mutationFn: (payload: RequestOtpPayload) => waitlistService.requestOtp(username, payload),
    });

    const joinMutation = useMutation({
        mutationFn: (payload: JoinPayload) => waitlistService.join(username, payload),
    });

    return {
        requestOtp: requestOtpMutation.mutateAsync,
        join: joinMutation.mutateAsync,
        isRequestingOtp: requestOtpMutation.isPending,
        isJoining: joinMutation.isPending,
    };
}
