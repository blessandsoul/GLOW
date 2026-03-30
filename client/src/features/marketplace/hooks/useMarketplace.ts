'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { marketplaceService } from '../services/marketplace.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { IProductFilters, ICreateProductRequest, IUpdateProductRequest } from '../types/marketplace.types';

export const marketplaceKeys = {
    all: ['marketplace'] as const,
    sellerStatus: () => [...marketplaceKeys.all, 'seller-status'] as const,
    myProducts: () => [...marketplaceKeys.all, 'my-products'] as const,
    products: (filters?: IProductFilters) => [...marketplaceKeys.all, 'products', filters] as const,
    product: (id: string) => [...marketplaceKeys.all, 'product', id] as const,
    sellerProducts: (username: string) => [...marketplaceKeys.all, 'seller-products', username] as const,
    adminSellers: (page: number, limit: number, status?: string) =>
        [...marketplaceKeys.all, 'admin', 'sellers', { page, limit, status }] as const,
};

export function useSellerStatus() {
    const { data, isLoading, error } = useQuery({
        queryKey: marketplaceKeys.sellerStatus(),
        queryFn: () => marketplaceService.getSellerStatus(),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { sellerStatus: data, isLoading };
}

export function useApplySeller() {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (reason: string) => marketplaceService.applySeller(reason),
        onSuccess: () => {
            toast.success('Заявка отправлена на рассмотрение');
            queryClient.invalidateQueries({ queryKey: marketplaceKeys.sellerStatus() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { apply: mutate, isPending };
}

export function useMyProducts() {
    const { data, isLoading, error } = useQuery({
        queryKey: marketplaceKeys.myProducts(),
        queryFn: () => marketplaceService.getMyProducts(),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { products: data ?? [], isLoading };
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (data: ICreateProductRequest) => marketplaceService.createProduct(data),
        onSuccess: () => {
            toast.success('Товар создан');
            queryClient.invalidateQueries({ queryKey: marketplaceKeys.myProducts() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { createProduct: mutate, isPending };
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateProductRequest }) =>
            marketplaceService.updateProduct(id, data),
        onSuccess: () => {
            toast.success('Товар обновлён');
            queryClient.invalidateQueries({ queryKey: marketplaceKeys.myProducts() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { updateProduct: mutate, isPending };
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: (id: string) => marketplaceService.deleteProduct(id),
        onSuccess: () => {
            toast.success('Товар удалён');
            queryClient.invalidateQueries({ queryKey: marketplaceKeys.myProducts() });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { deleteProduct: mutate, isPending };
}

export function useProducts(filters?: IProductFilters) {
    const { data, isLoading, error } = useQuery({
        queryKey: marketplaceKeys.products(filters),
        queryFn: () => marketplaceService.getProducts(filters),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        products: data?.data.items ?? [],
        pagination: data?.data.pagination,
        isLoading,
    };
}

export function useSellerProducts(username: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: marketplaceKeys.sellerProducts(username),
        queryFn: () => marketplaceService.getSellerProducts(username),
        enabled: !!username,
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return { products: data ?? [], isLoading };
}

export function useAdminSellers(page: number, limit: number, status?: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: marketplaceKeys.adminSellers(page, limit, status),
        queryFn: () => marketplaceService.adminGetSellers({ page, limit, status }),
    });

    useEffect(() => {
        if (error) toast.error(getErrorMessage(error));
    }, [error]);

    return {
        sellers: data?.data.items ?? [],
        pagination: data?.data.pagination,
        isLoading,
    };
}

export function useAdminReviewSeller() {
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: ({ userId, action, reason }: { userId: string; action: 'approve' | 'reject'; reason?: string }) =>
            marketplaceService.adminReviewSeller(userId, action, reason),
        onSuccess: (_, { action }) => {
            toast.success(action === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена');
            queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return { reviewSeller: mutate, isPending };
}
