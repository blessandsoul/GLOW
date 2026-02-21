import { apiClient } from '@/lib/api/axios.config';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Job, BatchCreateResult } from '../types/job.types';

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

    async getUserJobs(page = 1, limit = 10): Promise<{ items: Job[]; total: number }> {
        const { data } = await apiClient.get<PaginatedApiResponse<Job>>(
            API_ENDPOINTS.JOBS.LIST,
            { params: { page, limit } },
        );
        return {
            items: data.data.items,
            total: data.data.pagination.totalItems,
        };
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
}

export const jobService = new JobService();
