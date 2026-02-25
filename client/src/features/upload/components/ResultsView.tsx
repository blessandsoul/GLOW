'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Sparkle, Plus } from '@phosphor-icons/react';
import { ROUTES } from '@/lib/constants/routes';
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
    handleReset?: () => void;
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
                <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                    <Link
                        href={ROUTES.CREATE}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    >
                        <Plus size={13} weight="bold" />
                        {t('dashboard.create_new')}
                    </Link>
                </div>
            )}
        </div>
    );
}
