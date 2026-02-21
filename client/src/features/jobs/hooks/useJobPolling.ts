'use client';

import { useState, useEffect } from 'react';
import { jobService } from '../services/job.service';
import type { Job } from '../types/job.types';

export function useJobPolling(jobId: string | null): { job: Job | null; isPolling: boolean } {
    const [job, setJob] = useState<Job | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!jobId) {
            setJob(null);
            setIsPolling(false);
            return;
        }

        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const poll = async () => {
            setIsPolling(true);
            try {
                const data = await jobService.getJob(jobId);
                if (isMounted) {
                    setJob(data);
                    if (data.status !== 'DONE' && data.status !== 'FAILED') {
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
    }, [jobId]);

    return { job, isPolling };
}
