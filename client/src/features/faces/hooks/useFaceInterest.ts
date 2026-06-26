'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { facesService } from '../services/faces.service';
import { facesKeys } from './useFacesCatalog';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';

export function useInterestStatus(modelIds: string[]): Record<string, boolean> {
    const { data } = useQuery({
        queryKey: facesKeys.interestStatus(modelIds),
        queryFn: () => facesService.getInterestStatus(modelIds),
        enabled: modelIds.length > 0,
        staleTime: 60 * 1000,
    });
    return data ?? {};
}

export function useToggleInterest(): {
    toggle: (id: string, liked: boolean) => void;
    isPending: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const mutation = useMutation({
        mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
            liked ? facesService.removeInterest(id) : facesService.addInterest(id),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: facesKeys.all });
            toast.success(variables.liked ? t('faces.interest_removed') : t('faces.interest_added'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        toggle: (id, liked) => mutation.mutate({ id, liked }),
        isPending: mutation.isPending,
    };
}
