'use client';

import { useState, useEffect } from 'react';
import { jobService } from '../services/job.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { Job } from '../types/job.types';

const MAX_RETRIES = 3;

export function useJobPolling(jobId: string | null): { job: Job | null; isPolling: boolean; error: string | null } {
    const [job, setJob] = useState<Job | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) {
            setJob(null);
            setIsPolling(false);
            setError(null);
            return;
        }

        let isMounted = true;
        let timeoutId: NodeJS.Timeout;
        let retryCount = 0;

        const poll = async (): Promise<void> => {
            setIsPolling(true);
            try {
                const data = await jobService.getJob(jobId);
                if (isMounted) {
                    retryCount = 0;
                    setError(null);
                    setJob(data);
                    if (data.status !== 'DONE' && data.status !== 'FAILED') {
                        timeoutId = setTimeout(poll, 2000);
                    } else {
                        setIsPolling(false);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    retryCount++;
                    if (retryCount < MAX_RETRIES) {
                        timeoutId = setTimeout(poll, 2000);
                    } else {
                        setError(getErrorMessage(err));
                        setIsPolling(false);
                    }
                }
            }
        };

        poll();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [jobId]);

    return { job, isPolling, error };
}
