'use client';

import { ResultsGrid } from '@/features/jobs/components/ResultsGrid';
import type { Job } from '@/features/jobs/types/job.types';

interface ResultsViewProps {
    currentJob: Job;
    isAuthenticated: boolean;
    setRetouchUrl: (url: string | null) => void;
    handleDownload: (url: string, jobId: string, variantIndex: number, branded?: boolean) => Promise<void>;
}

export function ResultsView({
    currentJob,
    isAuthenticated,
    setRetouchUrl,
    handleDownload,
}: ResultsViewProps): React.ReactElement {
    return (
        <div className="flex w-full flex-col gap-4 overflow-y-auto px-3 py-3 md:p-6 [scrollbar-width:thin]">
            <ResultsGrid
                job={currentJob}
                isAuthenticated={isAuthenticated}
                onDownload={handleDownload}
                onRetouch={setRetouchUrl}
            />
        </div>
    );
}
