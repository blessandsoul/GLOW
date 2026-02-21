'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, ArrowSquareOut, Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/features/upload/components/UploadZone';
import { ResultsGrid } from '@/features/jobs/components/ResultsGrid';
import { useJobPolling } from '@/features/jobs/hooks/useJobPolling';
import { jobService } from '@/features/jobs/services/job.service';
import { creditsService } from '@/features/credits/services/credits.service';
import { getErrorMessage } from '@/lib/utils/error';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import type { Job } from '@/features/jobs/types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

function StepUpload({
    onUploaded,
    isUploading,
}: {
    onUploaded: (file: File) => void;
    isUploading: boolean;
}): React.ReactElement {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col gap-4">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">{t('ui.text_jluej9')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_14w0ny')}</p>
            </div>
            <UploadZone onFileSelect={onUploaded} isLoading={isUploading} className="min-h-48" />
            {isUploading && (
                <p className="text-center text-xs text-muted-foreground animate-pulse">{t('ui.text_vjn1ym')}</p>
            )}
        </div>
    );
}

function StepResults({
    job,
    onNext,
    onDownload,
}: {
    job: Job;
    onNext: () => void;
    onDownload: (url: string, jobId: string) => void;
}): React.ReactElement {
    const { t } = useLanguage();
    const { job: polledJob } = useJobPolling(job.id);
    const currentJob = polledJob ?? job;
    const isDone = currentJob.status === 'DONE';

    return (
        <div className="flex flex-col gap-5">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">{t('ui.text_z2ra5m')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('ui.text_ydq15s')}</p>
            </div>

            <ResultsGrid
                job={currentJob}
                isAuthenticated
                onDownload={onDownload}
            />

            {isDone && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-primary">{t('ui.text_s52kbi')}</p>
                </div>
            )}

            <Button
                onClick={onNext}
                className="w-full gap-2 transition-all duration-200 active:scale-[0.98]"
                disabled={!isDone}
            >
                {t('ui.text_nqkhcf')}<ArrowRight size={16} />
            </Button>
        </div>
    );
}

function StepNext({
    job,
    onComplete,
    onDownload,
}: {
    job: Job;
    onComplete: () => void;
    onDownload: (url: string, jobId: string) => void;
}): React.ReactElement {
    const { t } = useLanguage();
    const firstResult = job.results?.[0];

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">{t('ui.text_5dv7u0')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('ui.text_g7heti')}<span className="font-semibold text-foreground">{t('ui.text_81688q')}</span> {t('ui.text_lvd2qk')}</p>
            </div>

            <div className="flex flex-col gap-3">
                {firstResult && (
                    <button
                        type="button"
                        onClick={() => onDownload(firstResult, job.id)}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Download size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{t('ui.text_eljzys')}</p>
                            <p className="text-xs text-muted-foreground">{t('ui.text_gyndou')}</p>
                        </div>
                    </button>
                )}

                <button
                    type="button"
                    onClick={onComplete}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <ArrowSquareOut size={20} className="text-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{t('ui.text_uy3kp4')}</p>
                        <p className="text-xs text-muted-foreground">{t('ui.text_wl664d')}</p>
                    </div>
                </button>
            </div>

            <Button onClick={onComplete} className="w-full gap-2 transition-all duration-200 active:scale-[0.98]">
                {t('ui.text_uy3kp4')}<ArrowSquareOut size={16} />
            </Button>
        </div>
    );
}

export function OnboardingWizard(): React.ReactElement {
    const { t } = useLanguage();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [job, setJob] = useState<Job | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleComplete = useCallback(() => {
        localStorage.setItem('glowge_onboarded', '1');
        router.push('/dashboard');
    }, [router]);

    const handleFileSelect = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            const result = await jobService.uploadPhoto(file);
            setJob(result);
            setStep(2);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleDownload = useCallback(async (url: string, jobId: string) => {
        try {
            await creditsService.useCredit(jobId);
            const a = document.createElement('a');
            a.href = url;
            a.download = `glowge-${Date.now()}.jpg`;
            a.click();
            toast.success(t('ui.text_tv2fdm'));
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    }, []);

    return (
        <div className="relative w-full max-w-2xl">
            {/* Skip button */}
            <button
                type="button"
                onClick={handleComplete}
                className="absolute right-0 top-0 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-1"
            >
                {t('ui.text_rk78ry')}</button>

            <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 sm:p-8 flex flex-col gap-8 mt-8">
                <OnboardingStepIndicator currentStep={step} />

                {step === 1 && (
                    <StepUpload onUploaded={handleFileSelect} isUploading={isUploading} />
                )}
                {step === 2 && job && (
                    <StepResults job={job} onNext={() => setStep(3)} onDownload={handleDownload} />
                )}
                {step === 3 && job && (
                    <StepNext job={job} onComplete={handleComplete} onDownload={handleDownload} />
                )}
            </div>
        </div>
    );
}
