'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Plus, Sparkle, WarningCircle } from '@phosphor-icons/react';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { useBeforeAfter } from '@/features/before-after/hooks/useBeforeAfter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { useGuestJob } from '@/features/upload/hooks/useGuestJob';
import { ROUTES } from '@/lib/constants/routes';
import type { Job } from '@/features/jobs/types/job.types';

const ResultsView = dynamic(() => import('./ResultsView').then((m) => m.ResultsView), { ssr: false });
const BeforeAfterResults = dynamic(() => import('@/features/before-after/components/BeforeAfterResults').then((m) => m.BeforeAfterResults), { ssr: false });
const RetouchPanel = dynamic(() => import('@/features/retouch/components/RetouchPanel').then((m) => m.RetouchPanel), { ssr: false });

interface ResultsPageClientProps {
    jobId: string;
}

export function ResultsPageClient({ jobId }: ResultsPageClientProps): React.ReactElement {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const isDemo = jobId === 'demo';
    const isBA = jobId.startsWith('ba-');

    const { guestJob } = useGuestJob();
    const { job: polledJob, error: pollingError } = useJobPolling(isDemo ? null : jobId);
    const { job: baJob } = useBeforeAfter();

    const [showStories, setShowStories] = useState(false);
    const [retouchUrl, setRetouchUrl] = useState<string | null>(null);

    const currentJob: Job | null = isDemo ? guestJob : polledJob;

    const handleDownload = async (url: string, id: string, variantIndex: number, branded: boolean = false): Promise<void> => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
        const downloadUrl = `${apiBase}/jobs/${id}/download?variant=${variantIndex}&branded=${branded ? 1 : 0}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `glowge-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Before/After results
    if (isBA && baJob) {
        return (
            <ResultsPageShell>
                <BeforeAfterResults job={baJob} isAuthenticated={isAuthenticated} onDownload={handleDownload} />
                {(baJob.status === 'DONE' || baJob.status === 'FAILED') && (
                    <CreateNewBar t={t} />
                )}
            </ResultsPageShell>
        );
    }

    // Retouch panel
    if (currentJob && retouchUrl) {
        return (
            <ResultsPageShell>
                <RetouchPanel jobId={currentJob.id} imageUrl={retouchUrl} onClose={() => setRetouchUrl(null)} />
            </ResultsPageShell>
        );
    }

    // Error state
    if (pollingError) {
        return (
            <ResultsPageShell>
                <div className="flex w-full flex-col items-center gap-4 py-16">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <WarningCircle size={32} className="text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground">{pollingError}</p>
                    <CreateNewBar t={t} />
                </div>
            </ResultsPageShell>
        );
    }

    // Loading state
    if (!currentJob) {
        return (
            <ResultsPageShell>
                <div className="flex w-full flex-col items-center justify-center gap-6 py-16 px-6">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Sparkle size={28} weight="fill" className="animate-pulse text-primary" />
                        </div>
                        <div className="absolute -inset-1 rounded-2xl bg-primary/5 animate-ping" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{t('upload.photo_uploading')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t('upload.photo_sending')}</p>
                    </div>
                    <div className="flex w-full max-w-xs justify-center">
                        <div className="aspect-3/4 w-full animate-pulse rounded-xl bg-muted" />
                    </div>
                </div>
            </ResultsPageShell>
        );
    }

    // Results
    return (
        <ResultsPageShell>
            <ResultsView
                t={t}
                currentJob={currentJob}
                isAuthenticated={isAuthenticated}
                isDemoJob={isDemo}
                showStories={showStories}
                setShowStories={setShowStories}
                setRetouchUrl={setRetouchUrl}
                handleDownload={handleDownload}
                handleReset={() => {}}
            />
            {(currentJob.status === 'DONE' || currentJob.status === 'FAILED') && (
                <CreateNewBar t={t} />
            )}
        </ResultsPageShell>
    );
}

function ResultsPageShell({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <div className="flex w-full flex-col overflow-y-auto [scrollbar-width:thin]">
            {children}
        </div>
    );
}

function CreateNewBar({ t }: { t: (key: string) => string }): React.ReactElement {
    return (
        <div className="flex items-center justify-center gap-3 pt-4 pb-6">
            <Link
                href={ROUTES.CREATE}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
                <Plus size={13} weight="bold" />
                {t('dashboard.create_new')}
            </Link>
        </div>
    );
}
