'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { beforeAfterService } from '../services/before-after.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { BeforeAfterJob, BeforeAfterSettings } from '../types/before-after.types';

interface UploadPayload {
    beforeFile: File;
    afterFile: File;
    settings?: BeforeAfterSettings;
}

export function useBeforeAfter() {
    const [job, setJob] = useState<BeforeAfterJob | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!job?.id || (job.status !== 'PENDING' && job.status !== 'PROCESSING')) {
            setIsPolling(false);
            return;
        }

        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const poll = async () => {
            setIsPolling(true);
            try {
                const data = await beforeAfterService.getJob(job.id);
                if (isMounted) {
                    setJob(data);
                    if (data.status === 'PENDING' || data.status === 'PROCESSING') {
                        timeoutId = setTimeout(poll, 2000);
                    } else {
                        setIsPolling(false);
                    }
                }
            } catch (error) {
                if (isMounted) setIsPolling(false);
            }
        };

        poll();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [job?.id, job?.status]);

    const upload = useCallback(async ({ beforeFile, afterFile, settings }: UploadPayload) => {
        setIsUploading(true);
        try {
            const data = await beforeAfterService.upload(beforeFile, afterFile, settings);
            setJob(data);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsUploading(false);
        }
    }, []);

    const reset = useCallback(() => setJob(null), []);

    return { job, isUploading, isPolling, upload, reset };
}
