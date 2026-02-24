'use client';

import { useState, useCallback } from 'react';
import { jobService } from '@/features/jobs/services/job.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useAppDispatch } from '@/store/hooks';
import { updateCredits } from '@/features/auth/store/authSlice';
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
    const dispatch = useAppDispatch();

    const uploadFile = useCallback(
        async ({ file, settings }: UploadPayload) => {
            setIsUploading(true);
            setError(null);
            try {
                const data = await jobService.uploadPhoto(file, settings);
                setJob(data);
                // Sync credit balance in Redux after successful upload
                if (data.creditsRemaining !== undefined) {
                    dispatch(updateCredits(data.creditsRemaining));
                }
            } catch (err) {
                const message = getErrorMessage(err);
                setError(message);
                toast.error(message);
            } finally {
                setIsUploading(false);
            }
        },
        [dispatch]
    );

    return { job, isUploading, error, uploadFile };
}
