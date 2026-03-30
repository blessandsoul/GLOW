import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import type {
    IProduct,
    ISellerStatusResponse,
    ISellerApplication,
    ICreateProductRequest,
    IUpdateProductRequest,
    IProductFilters,
} from '../types/marketplace.types';

class MarketplaceService {
    async getSellerStatus(): Promise<ISellerStatusResponse> {
        const res = await apiClient.get<ApiResponse<ISellerStatusResponse>>(
            API_ENDPOINTS.MARKETPLACE.SELLER_STATUS,
        );
        return res.data.data;
    }

    async applySeller(reason: string): Promise<ISellerStatusResponse> {
        const res = await apiClient.post<ApiResponse<ISellerStatusResponse>>(
            API_ENDPOINTS.MARKETPLACE.SELLER_APPLY,
            { reason },
        );
        return res.data.data;
    }

    async adminGetSellers(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedApiResponse<ISellerApplication>> {
        const res = await apiClient.get<PaginatedApiResponse<ISellerApplication>>(
            API_ENDPOINTS.MARKETPLACE.ADMIN_SELLERS,
            { params },
        );
        return res.data;
    }

    async adminReviewSeller(
        userId: string,
        action: 'approve' | 'reject',
        reason?: string,
    ): Promise<ISellerApplication> {
        const res = await apiClient.post<ApiResponse<ISellerApplication>>(
            API_ENDPOINTS.MARKETPLACE.ADMIN_REVIEW_SELLER(userId),
            { action, reason },
        );
        return res.data.data;
    }

    async getMyProducts(): Promise<IProduct[]> {
        const res = await apiClient.get<ApiResponse<IProduct[]>>(
            API_ENDPOINTS.MARKETPLACE.MY_PRODUCTS,
        );
        return res.data.data;
    }

    async createProduct(data: ICreateProductRequest): Promise<IProduct> {
        const res = await apiClient.post<ApiResponse<IProduct>>(
            API_ENDPOINTS.MARKETPLACE.PRODUCTS,
            data,
        );
        return res.data.data;
    }

    async uploadProductImage(productId: string, file: File): Promise<IProduct> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<ApiResponse<IProduct>>(
            API_ENDPOINTS.MARKETPLACE.PRODUCT_IMAGES(productId),
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return res.data.data;
    }

    async updateProduct(id: string, data: IUpdateProductRequest): Promise<IProduct> {
        const res = await apiClient.patch<ApiResponse<IProduct>>(
            API_ENDPOINTS.MARKETPLACE.PRODUCT(id),
            data,
        );
        return res.data.data;
    }

    async deleteProduct(id: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.MARKETPLACE.PRODUCT(id));
    }

    async getProducts(filters?: IProductFilters): Promise<PaginatedApiResponse<IProduct>> {
        const res = await apiClient.get<PaginatedApiResponse<IProduct>>(
            API_ENDPOINTS.MARKETPLACE.PRODUCTS,
            { params: filters },
        );
        return res.data;
    }

    async getProduct(id: string): Promise<IProduct> {
        const res = await apiClient.get<ApiResponse<IProduct>>(
            API_ENDPOINTS.MARKETPLACE.PRODUCT(id),
        );
        return res.data.data;
    }

    async getSellerProducts(username: string): Promise<IProduct[]> {
        const res = await apiClient.get<ApiResponse<IProduct[]>>(
            API_ENDPOINTS.MARKETPLACE.SELLER_PRODUCTS(username),
        );
        return res.data.data;
    }
}

export const marketplaceService = new MarketplaceService();
