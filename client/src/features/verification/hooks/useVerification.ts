'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { verificationService } from '../services/verification.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { VerificationState, VerificationRequest } from '../types/verification.types';
import type { PaginationMeta } from '@/lib/api/api.types';

export const verificationKeys = {
    all: ['verification'] as const,
    state: () => [...verificationKeys.all, 'state'] as const,
    adminPending: (page: number, limit: number) =>
        [...verificationKeys.all, 'admin', 'pending', { page, limit }] as const,
    adminAll: (page: number, limit: number, status?: string) =>
        [...verificationKeys.all, 'admin', 'all', { page, limit, status }] as const,
};

export function useVerificationState(): {
    state: VerificationState | undefined;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: verificationKeys.state(),
        queryFn: () => verificationService.getState(),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { state: data, isLoading };
}

export function useRequestVerification(): {
    request: (experienceYears?: number) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (experienceYears?: number) =>
            verificationService.requestVerification(experienceYears),
        onSuccess: () => {
            toast.success('Verification request submitted');
            queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { request: mutate, isPending };
}

export function useUploadIdDocument(): {
    upload: (file: File) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (file: File) => verificationService.uploadIdDocument(file),
        onSuccess: () => {
            toast.success('ID document uploaded');
            queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { upload: mutate, isPending };
}

export function useUploadCertificate(): {
    upload: (file: File) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (file: File) => verificationService.uploadCertificate(file),
        onSuccess: () => {
            toast.success('Certificate uploaded');
            queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { upload: mutate, isPending };
}

export function useUploadHygienePics(): {
    upload: (files: File[]) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (files: File[]) => verificationService.uploadHygienePics(files),
        onSuccess: () => {
            toast.success('Hygiene photos uploaded');
            queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { upload: mutate, isPending };
}

export function useUploadQualityProductsPics(): {
    upload: (files: File[]) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (files: File[]) => verificationService.uploadQualityProductsPics(files),
        onSuccess: () => {
            toast.success('Quality products photos uploaded');
            queryClient.invalidateQueries({ queryKey: verificationKeys.state() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { upload: mutate, isPending };
}

export function useAdminPendingVerifications(
    page: number,
    limit: number,
): {
    requests: VerificationRequest[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: verificationKeys.adminPending(page, limit),
        queryFn: () => verificationService.getAdminPending({ page, limit }),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        requests: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useAdminAllVerifications(
    page: number,
    limit: number,
    status?: string,
): {
    requests: VerificationRequest[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: verificationKeys.adminAll(page, limit, status),
        queryFn: () => verificationService.getAdminAll({ page, limit, status }),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        requests: data?.items ?? [],
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useAdminReviewVerification(): {
    review: (args: { userId: string; approved: boolean; rejectionReason?: string }) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: ({
            userId,
            ...body
        }: {
            userId: string;
            approved: boolean;
            rejectionReason?: string;
        }) => verificationService.adminReview(userId, body),
        onSuccess: () => {
            toast.success('Verification reviewed');
            queryClient.invalidateQueries({ queryKey: [...verificationKeys.all, 'admin'] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { review: mutate, isPending };
}

export function useAdminSetBadge(): {
    setBadge: (args: { userId: string; badge: string; value: boolean }) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: ({ userId, ...body }: { userId: string; badge: string; value: boolean }) =>
            verificationService.adminSetBadge(userId, body),
        onSuccess: () => {
            toast.success('Badge updated');
            queryClient.invalidateQueries({ queryKey: [...verificationKeys.all, 'admin'] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { setBadge: mutate, isPending };
}

export function useAdminSetTier(): {
    setTier: (args: { userId: string; tier: string }) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: ({ userId, tier }: { userId: string; tier: string }) =>
            verificationService.adminSetTier(userId, tier),
        onSuccess: () => {
            toast.success('Master tier updated');
            queryClient.invalidateQueries({ queryKey: [...verificationKeys.all, 'admin'] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { setTier: mutate, isPending };
}
