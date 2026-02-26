'use client';

import dynamic from 'next/dynamic';
import { GuestResultBanner } from './GuestResultBanner';
import { ResultsGrid } from '@/features/jobs/components/ResultsGrid';
import type { Job } from '@/features/jobs/types/job.types';

const StoriesGenerator = dynamic(() => import('@/features/stories/components/StoriesGenerator').then((m) => m.StoriesGenerator), { ssr: false });

interface ResultsViewProps {
    currentJob: Job;
    isAuthenticated: boolean;
    isDemoJob: boolean;
    showStories: boolean;
    setRetouchUrl: (url: string | null) => void;
    handleDownload: (url: string, jobId: string, variantIndex: number, branded?: boolean) => Promise<void>;
}

export function ResultsView({
    currentJob,
    isAuthenticated,
    isDemoJob,
    showStories,
    setRetouchUrl,
    handleDownload,
}: ResultsViewProps): React.ReactElement {
    return (
        <div className="flex w-full flex-col gap-4 overflow-y-auto px-3 py-3 md:p-6 [scrollbar-width:thin]">
            {!isAuthenticated && currentJob.status === 'DONE' && (
                <GuestResultBanner jobId={currentJob.id} />
            )}
            <ResultsGrid
                job={currentJob}
                isAuthenticated={isAuthenticated}
                isDemo={isDemoJob}
                onDownload={handleDownload}
                onRetouch={setRetouchUrl}
            />
            {showStories && currentJob.status === 'DONE' && (
                <StoriesGenerator jobId={currentJob.id} />
            )}
        </div>
    );
}
