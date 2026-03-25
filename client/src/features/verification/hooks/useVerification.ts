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

export function useGlowStarState(): {
    state: { glowStarStatus: string; glowStarRequestedAt: string | null; masterTier: string } | undefined;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: [...verificationKeys.all, 'glow-star'] as const,
        queryFn: () => verificationService.getGlowStarState(),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { state: data, isLoading };
}

export function useRequestGlowStar(): {
    request: () => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: () => verificationService.requestGlowStar(),
        onSuccess: () => {
            toast.success('Glow Star request submitted');
            queryClient.invalidateQueries({ queryKey: [...verificationKeys.all, 'glow-star'] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { request: mutate, isPending };
}

export interface GlowStarRequestFlat {
    userId: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    username: string | null;
    phone: string | null;
    niche: string | null;
    city: string | null;
    instagram: string | null;
    masterTier: string;
    glowStarStatus: string;
    glowStarRequestedAt: string | null;
    experienceYears: number | null;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    verificationStatus: string;
    portfolioCount: number;
}

export function useAdminGlowStarRequests(page: number, limit: number): {
    requests: GlowStarRequestFlat[];
    pagination: PaginationMeta | null;
    isLoading: boolean;
} {
    const { data, isLoading, error } = useQuery({
        queryKey: [...verificationKeys.all, 'admin', 'glow-star', { page, limit }] as const,
        queryFn: () => verificationService.adminGetGlowStarRequests({ page, limit }),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    const requests: GlowStarRequestFlat[] = (data?.items ?? []).map((item) => ({
        userId: item.userId,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        avatar: item.user.avatar,
        username: item.user.username,
        phone: item.user.phone,
        niche: item.niche,
        city: item.city,
        instagram: item.instagram,
        masterTier: item.masterTier,
        glowStarStatus: item.glowStarStatus,
        glowStarRequestedAt: item.glowStarRequestedAt,
        experienceYears: item.experienceYears,
        isCertified: item.isCertified,
        isHygieneVerified: item.isHygieneVerified,
        isQualityProducts: item.isQualityProducts,
        verificationStatus: item.verificationStatus,
        portfolioCount: item.portfolioCount,
    }));

    return {
        requests,
        pagination: data?.pagination ?? null,
        isLoading,
    };
}

export function useAdminReviewGlowStar(): {
    review: (args: { userId: string; action: 'accept' | 'approve' | 'reject' }) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: ({ userId, action }: { userId: string; action: 'accept' | 'approve' | 'reject' }) =>
            verificationService.adminReviewGlowStar(userId, action),
        onSuccess: () => {
            toast.success('Glow Star request reviewed');
            queryClient.invalidateQueries({ queryKey: [...verificationKeys.all, 'admin', 'glow-star'] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { review: mutate, isPending };
}
