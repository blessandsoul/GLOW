import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse, PaginationMeta } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { VerificationState, VerificationRequest } from '../types/verification.types';

class VerificationService {
    async getState(): Promise<VerificationState> {
        const { data } = await apiClient.get<ApiResponse<VerificationState>>(
            API_ENDPOINTS.VERIFICATION.STATE,
        );
        return data.data;
    }

    async requestVerification(experienceYears?: number): Promise<VerificationState> {
        const { data } = await apiClient.post<ApiResponse<VerificationState>>(
            API_ENDPOINTS.VERIFICATION.REQUEST,
            experienceYears !== undefined ? { experienceYears } : {},
        );
        return data.data;
    }

    async uploadIdDocument(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post<ApiResponse<{ url: string }>>(
            API_ENDPOINTS.VERIFICATION.UPLOAD_ID,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async uploadCertificate(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post<ApiResponse<{ url: string }>>(
            API_ENDPOINTS.VERIFICATION.UPLOAD_CERTIFICATE,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async uploadHygienePics(files: File[]): Promise<{ urls: string[] }> {
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        const { data } = await apiClient.post<ApiResponse<{ urls: string[] }>>(
            API_ENDPOINTS.VERIFICATION.UPLOAD_HYGIENE,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async uploadQualityProductsPics(files: File[]): Promise<{ urls: string[] }> {
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        const { data } = await apiClient.post<ApiResponse<{ urls: string[] }>>(
            API_ENDPOINTS.VERIFICATION.UPLOAD_QUALITY_PRODUCTS,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async getAdminPending(params?: {
        page?: number;
        limit?: number;
    }): Promise<{ items: VerificationRequest[]; pagination: PaginationMeta }> {
        const { data } = await apiClient.get<PaginatedApiResponse<VerificationRequest>>(
            API_ENDPOINTS.VERIFICATION.ADMIN_PENDING,
            { params },
        );
        return {
            items: data.data.items,
            pagination: data.data.pagination,
        };
    }

    async getAdminAll(params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{ items: VerificationRequest[]; pagination: PaginationMeta }> {
        const { data } = await apiClient.get<PaginatedApiResponse<VerificationRequest>>(
            API_ENDPOINTS.VERIFICATION.ADMIN_ALL,
            { params },
        );
        return {
            items: data.data.items,
            pagination: data.data.pagination,
        };
    }

    async adminReview(
        userId: string,
        body: { approved: boolean; rejectionReason?: string },
    ): Promise<void> {
        await apiClient.post(API_ENDPOINTS.VERIFICATION.ADMIN_REVIEW(userId), {
            action: body.approved ? 'approve' : 'reject',
            reason: body.rejectionReason,
        });
    }

    async adminSetBadge(
        userId: string,
        body: { badge: string; value: boolean },
    ): Promise<void> {
        await apiClient.post(API_ENDPOINTS.VERIFICATION.ADMIN_BADGE(userId), {
            badge: body.badge,
            granted: body.value,
        });
    }
}

export const verificationService = new VerificationService();
