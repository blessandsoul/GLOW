'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { portfolioService } from '../services/portfolio.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { PortfolioItem, PortfolioItemFormData, PublicPortfolioData } from '../types/portfolio.types';

const portfolioKeys = {
    all: ['portfolio'] as const,
    me: () => [...portfolioKeys.all, 'me'] as const,
};

export function useMyPortfolio(): {
    items: PortfolioItem[];
    isLoading: boolean;
    addItem: (formData: PortfolioItemFormData) => Promise<void>;
    isAdding: boolean;
    uploadImage: (file: File) => Promise<void>;
    isUploading: boolean;
    updateItem: (params: { id: string; data: Partial<PortfolioItemFormData> }) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    isDeleting: boolean;
} {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const { data: items = [], isLoading } = useQuery({
        queryKey: portfolioKeys.me(),
        queryFn: () => portfolioService.getMyPortfolio(),
        staleTime: 5 * 60 * 1000,
    });

    const addMutation = useMutation({
        mutationFn: (formData: PortfolioItemFormData) => portfolioService.addItem(formData),
        onMutate: async (formData) => {
            await queryClient.cancelQueries({ queryKey: portfolioKeys.me() });
            const previous = queryClient.getQueryData<PortfolioItem[]>(portfolioKeys.me());

            // Optimistic add
            const optimisticItem: PortfolioItem = {
                id: `optimistic-${Date.now()}`,
                userId: '',
                jobId: formData.jobId ?? null,
                imageUrl: formData.imageUrl,
                title: formData.title || null,
                niche: formData.niche || null,
                isPublished: formData.isPublished,
                sortOrder: (previous?.length ?? 0) + 1,
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<PortfolioItem[]>(portfolioKeys.me(), (old) => [
                ...(old ?? []),
                optimisticItem,
            ]);

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(portfolioKeys.me(), context.previous);
            }
            toast.error(getErrorMessage(_err));
        },
        onSuccess: () => {
            toast.success(t('system.sys_ykzsc6'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: portfolioKeys.me() });
        },
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => portfolioService.uploadImage(file),
        onSuccess: () => {
            toast.success(t('system.sys_ykzsc6'));
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: portfolioKeys.me() });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PortfolioItemFormData> }) =>
            portfolioService.updateItem(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: portfolioKeys.me() });
            const previous = queryClient.getQueryData<PortfolioItem[]>(portfolioKeys.me());

            queryClient.setQueryData<PortfolioItem[]>(portfolioKeys.me(), (old) =>
                (old ?? []).map((item) =>
                    item.id === id ? { ...item, ...data } : item,
                ),
            );

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(portfolioKeys.me(), context.previous);
            }
            toast.error(getErrorMessage(_err));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: portfolioKeys.me() });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => portfolioService.deleteItem(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: portfolioKeys.me() });
            const previous = queryClient.getQueryData<PortfolioItem[]>(portfolioKeys.me());

            queryClient.setQueryData<PortfolioItem[]>(portfolioKeys.me(), (old) =>
                (old ?? []).filter((item) => item.id !== id),
            );

            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(portfolioKeys.me(), context.previous);
            }
            toast.error(getErrorMessage(_err));
        },
        onSuccess: () => {
            toast.success(t('system.sys_n9htfx'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: portfolioKeys.me() });
        },
    });

    const addItem = async (formData: PortfolioItemFormData): Promise<void> => {
        await addMutation.mutateAsync(formData);
    };

    const uploadImage = async (file: File): Promise<void> => {
        await uploadMutation.mutateAsync(file);
    };

    const updateItem = async ({ id, data }: { id: string; data: Partial<PortfolioItemFormData> }): Promise<void> => {
        await updateMutation.mutateAsync({ id, data });
    };

    const deleteItem = async (id: string): Promise<void> => {
        await deleteMutation.mutateAsync(id);
    };

    return {
        items,
        isLoading,
        addItem,
        isAdding: addMutation.isPending,
        uploadImage,
        isUploading: uploadMutation.isPending,
        updateItem,
        deleteItem,
        isDeleting: deleteMutation.isPending,
    };
}

export function usePublicPortfolio(username: string): {
    portfolio: PublicPortfolioData | undefined;
    isLoading: boolean;
    isError: boolean;
} {
    const [portfolio, setPortfolio] = useState<PublicPortfolioData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!username) return;
        let isMounted = true;
        const fetchPublic = async (): Promise<void> => {
            setIsLoading(true);
            setIsError(false);
            try {
                const data = await portfolioService.getPublicPortfolio(username);
                if (isMounted) setPortfolio(data);
            } catch {
                if (isMounted) setIsError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchPublic();
        return () => { isMounted = false; };
    }, [username]);

    return { portfolio, isLoading, isError };
}
