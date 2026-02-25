import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Job, JobStatus, BatchCreateResult, DashboardStats } from '../types/job.types';
import type { JobResultImage } from '@/features/portfolio/types/builder.types';

class JobService {
    async uploadPhoto(file: File, settings?: object): Promise<Job> {
        const formData = new FormData();
        formData.append('file', file);
        if (settings) {
            formData.append('settings', JSON.stringify(settings));
        }
        const { data } = await apiClient.post<ApiResponse<Job>>(
            API_ENDPOINTS.JOBS.LIST,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async uploadGuestPhoto(file: File, settings?: object, sessionId?: string): Promise<Job> {
        const formData = new FormData();
        formData.append('file', file);
        if (settings) {
            formData.append('settings', JSON.stringify(settings));
        }
        if (sessionId) {
            formData.append('sessionId', sessionId);
        }
        const { data } = await apiClient.post<ApiResponse<Job>>(
            API_ENDPOINTS.JOBS.GUEST,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async getJob(id: string): Promise<Job> {
        const { data } = await apiClient.get<ApiResponse<Job>>(
            API_ENDPOINTS.JOBS.GET(id),
        );
        return data.data;
    }

    async getUserJobs(page = 1, limit = 20, filters?: { status?: JobStatus }): Promise<{ items: Job[]; total: number; hasNextPage: boolean; page: number }> {
        const { data } = await apiClient.get<PaginatedApiResponse<Job>>(
            API_ENDPOINTS.JOBS.LIST,
            { params: { page, limit, ...filters } },
        );
        return {
            items: data.data.items,
            total: data.data.pagination.totalItems,
            hasNextPage: data.data.pagination.hasNextPage,
            page: data.data.pagination.page,
        };
    }

    async getResultImages(): Promise<JobResultImage[]> {
        const { data } = await apiClient.get<ApiResponse<JobResultImage[]>>(
            API_ENDPOINTS.JOBS.RESULTS,
        );
        return data.data;
    }

    async uploadBatch(files: File[], settings?: object): Promise<BatchCreateResult> {
        const formData = new FormData();
        files.forEach((file) => formData.append('file', file));
        if (settings) {
            formData.append('settings', JSON.stringify(settings));
        }
        const { data } = await apiClient.post<ApiResponse<BatchCreateResult>>(
            API_ENDPOINTS.JOBS.BATCH,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data;
    }

    async deleteJob(id: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.JOBS.DELETE(id));
    }

    async bulkDeleteJobs(jobIds: string[]): Promise<{ deleted: number }> {
        const { data } = await apiClient.delete<ApiResponse<{ deleted: number }>>(
            API_ENDPOINTS.JOBS.BULK_DELETE,
            { data: { jobIds } },
        );
        return data.data;
    }

    async getStats(): Promise<DashboardStats> {
        const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
            API_ENDPOINTS.JOBS.STATS,
        );
        return data.data;
    }
}

export const jobService = new JobService();
