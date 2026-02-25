'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react';
import { GuestResultBanner } from './GuestResultBanner';
import { ResultsGrid } from '@/features/jobs/components/ResultsGrid';
import type { Job } from '@/features/jobs/types/job.types';

const StoriesGenerator = dynamic(() => import('@/features/stories/components/StoriesGenerator').then((m) => m.StoriesGenerator), { ssr: false });

interface ResultsViewProps {
    t: (key: string) => string;
    currentJob: Job;
    isAuthenticated: boolean;
    isDemoJob: boolean;
    showStories: boolean;
    setShowStories: (v: boolean) => void;
    setRetouchUrl: (url: string | null) => void;
    handleDownload: (url: string, jobId: string, variantIndex: number, branded?: boolean) => Promise<void>;
    handleReset: () => void;
}

export function ResultsView({
    t,
    currentJob,
    isAuthenticated,
    isDemoJob,
    showStories,
    setShowStories,
    setRetouchUrl,
    handleDownload,
    handleReset,
}: ResultsViewProps): React.ReactElement {
    return (
        <div className="flex w-full flex-col gap-6 overflow-y-auto p-5 md:p-6 [scrollbar-width:thin]">
            {!isAuthenticated && currentJob.status === 'DONE' && (
                <GuestResultBanner jobId={currentJob.id} />
            )}
            <ResultsGrid
                job={currentJob}
                isAuthenticated={isAuthenticated}
                isDemo={isDemoJob}
                onDownload={handleDownload}
                onGenerateStories={() => setShowStories(true)}
                onRetouch={setRetouchUrl}
            />
            {showStories && currentJob.status === 'DONE' && (
                <StoriesGenerator jobId={currentJob.id} />
            )}
            {(currentJob.status === 'DONE' || currentJob.status === 'FAILED') && (
                <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:border-border hover:shadow-sm"
                    >
                        <ArrowLeft size={12} />
                        {t('ui.text_8kq3qa')}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                        <ArrowCounterClockwise size={12} />
                        {t('ui.text_84crcz')}
                    </button>
                </div>
            )}
        </div>
    );
}
