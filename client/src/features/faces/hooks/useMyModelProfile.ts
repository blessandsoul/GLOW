'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { facesService } from '../services/faces.service';
import { facesKeys } from './useFacesCatalog';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { MyModelProfile, ModelOnboardingPayload } from '../types/faces.types';

export function useMyModelProfile(enabled = true): {
    profile: MyModelProfile | undefined;
    isLoading: boolean;
    isError: boolean;
} {
    const { data, isLoading, isError } = useQuery({
        queryKey: facesKeys.me(),
        queryFn: () => facesService.getMe(),
        enabled,
        retry: false,
    });
    return { profile: data, isLoading, isError };
}

export function useModelProfileActions(): {
    uploadPhoto: (file: File) => void;
    deletePhoto: (photoId: string) => void;
    setPrimary: (photoId: string) => void;
    requestReview: () => void;
    setBlur: (blurred: boolean) => void;
    withdraw: () => void;
    isUploading: boolean;
    isBusy: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const invalidate = (): void => {
        void queryClient.invalidateQueries({ queryKey: facesKeys.me() });
    };
    const onError = (error: unknown): void => {
        toast.error(getErrorMessage(error));
    };

    const upload = useMutation({
        mutationFn: (file: File) => facesService.uploadPhoto(file),
        onSuccess: () => {
            invalidate();
            toast.success(t('faces.photo_uploaded'));
        },
        onError,
    });

    const remove = useMutation({
        mutationFn: (photoId: string) => facesService.deletePhoto(photoId),
        onSuccess: invalidate,
        onError,
    });

    const primary = useMutation({
        mutationFn: (photoId: string) => facesService.setPrimaryPhoto(photoId),
        onSuccess: invalidate,
        onError,
    });

    const review = useMutation({
        mutationFn: () => facesService.requestReview(),
        onSuccess: () => {
            invalidate();
            toast.success(t('faces.review_submitted'));
        },
        onError,
    });

    const blur = useMutation({
        mutationFn: (blurred: boolean) => (blurred ? facesService.blur() : facesService.unblur()),
        onSuccess: invalidate,
        onError,
    });

    const withdraw = useMutation({
        mutationFn: () => facesService.withdraw(),
        onSuccess: () => {
            invalidate();
            toast.success(t('faces.withdrawn'));
        },
        onError,
    });

    return {
        uploadPhoto: (file) => upload.mutate(file),
        deletePhoto: (photoId) => remove.mutate(photoId),
        setPrimary: (photoId) => primary.mutate(photoId),
        requestReview: () => review.mutate(),
        setBlur: (blurred) => blur.mutate(blurred),
        withdraw: () => withdraw.mutate(),
        isUploading: upload.isPending,
        isBusy: remove.isPending || primary.isPending || review.isPending || blur.isPending || withdraw.isPending,
    };
}

export function useModelOnboarding(): {
    onboard: (payload: ModelOnboardingPayload) => Promise<void>;
    isPending: boolean;
} {
    const mutation = useMutation({
        mutationFn: (payload: ModelOnboardingPayload) => facesService.onboard(payload),
    });
    return { onboard: mutation.mutateAsync, isPending: mutation.isPending };
}
