'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { Job } from '@/features/jobs/types/job.types';

interface GuestJobContextValue {
    guestJob: Job | null;
    setGuestJob: (job: Job | null) => void;
    clearGuestJob: () => void;
}

const GuestJobContext = createContext<GuestJobContextValue | null>(null);

export function GuestJobProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [guestJob, setGuestJob] = useState<Job | null>(null);

    const clearGuestJob = useCallback(() => setGuestJob(null), []);

    return (
        <GuestJobContext.Provider value={{ guestJob, setGuestJob, clearGuestJob }}>
            {children}
        </GuestJobContext.Provider>
    );
}

export function useGuestJob(): GuestJobContextValue {
    const ctx = useContext(GuestJobContext);
    if (!ctx) {
        throw new Error('useGuestJob must be used within GuestJobProvider');
    }
    return ctx;
}
