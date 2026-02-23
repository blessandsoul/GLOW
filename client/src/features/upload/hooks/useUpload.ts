'use client';

import { useState, useCallback } from 'react';
import { jobService } from '@/features/jobs/services/job.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { Job } from '@/features/jobs/types/job.types';
import type { PhotoSettings } from '@/features/upload/types/upload.types';
import { toast } from 'sonner';

interface UploadPayload {
    file: File;
    settings: PhotoSettings;
}

interface UseUploadReturn {
    job: Job | null;
    isUploading: boolean;
    error: string | null;
    uploadFile: (payload: UploadPayload) => void;
}

export function useUpload(): UseUploadReturn {
    const [job, setJob] = useState<Job | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(
        async ({ file, settings }: UploadPayload) => {
            setIsUploading(true);
            setError(null);
            try {
                const data = await jobService.uploadPhoto(file, settings);
                setJob(data);
            } catch (err) {
                const message = getErrorMessage(err);
                setError(message);
                toast.error(message);
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    return { job, isUploading, error, uploadFile };
}
