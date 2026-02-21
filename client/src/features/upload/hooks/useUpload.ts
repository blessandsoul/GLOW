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
    uploadFile: (payload: UploadPayload) => void;
}

export function useUpload(): UseUploadReturn {
    const [job, setJob] = useState<Job | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = useCallback(
        async ({ file, settings }: UploadPayload) => {
            setIsUploading(true);
            try {
                const data = await jobService.uploadPhoto(file, settings);
                setJob(data);
            } catch (err) {
                toast.error(getErrorMessage(err));
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    return { job, isUploading, uploadFile };
}
