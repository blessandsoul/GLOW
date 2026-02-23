'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, CheckCircle, SpinnerGap, WarningCircle, Stack, PaperPlaneTilt, InstagramLogo, ArrowSquareOut } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services/job.service';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import type { Job, JobStatus } from '../types/job.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getServerImageUrl } from '@/lib/utils/image';

function StatusBadge({ status }: { status: JobStatus }): React.ReactElement {
    const { t } = useLanguage();

    const config: Record<JobStatus, { icon: React.ReactNode; label: string; className: string }> = {
        PENDING: {
            icon: <Clock size={12} />,
            label: t('dashboard.status_pending'),
            className: 'text-muted-foreground',
        },
        PROCESSING: {
            icon: <SpinnerGap size={12} className="animate-spin" />,
            label: t('dashboard.status_processing'),
            className: 'text-primary',
        },
        DONE: {
            icon: <CheckCircle size={12} />,
            label: t('dashboard.status_done'),
            className: 'text-green-600',
        },
        FAILED: {
            icon: <WarningCircle size={12} />,
            label: t('dashboard.status_failed'),
            className: 'text-destructive',
        },
    };
    const { icon, label, className } = config[status];
    return (
        <span className={`flex items-center gap-1 text-xs font-medium ${className}`}>
            {icon}
            {label}
        </span>
    );
}

function SingleJobCard({ job }: { job: Job }): React.ReactElement {
    const isDone = job.status === 'DONE';
    const showcaseUrl = ROUTES.SHOWCASE(job.id);

    const handleWhatsApp = (e: React.MouseEvent): void => {
        e.preventDefault();
        const url = typeof window !== 'undefined'
            ? `${window.location.origin}${showcaseUrl}`
            : showcaseUrl;
        const text = encodeURIComponent(`Посмотрите результат вашей процедуры: ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const cardContent = (
        <div className="flex gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={getServerImageUrl(job.originalUrl)} alt="Original" fill unoptimized sizes="48px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between min-w-0">
                <StatusBadge status={job.status} />
                <p className="text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>
            {job.results && job.results.length > 0 && (
                <div className="flex gap-1">
                    {job.results.slice(0, 2).map((url, i) => (
                        <div key={url} className="relative h-16 w-12 overflow-hidden rounded-lg">
                            <Image src={getServerImageUrl(url)} alt={`Result ${i + 1}`} fill unoptimized sizes="48px" className="object-cover" />
                        </div>
                    ))}
                </div>
            )}
            {/* Quick actions — only when done */}
            {isDone && (
                <div className="flex shrink-0 flex-col gap-1 justify-center">
                    <button
                        type="button"
                        onClick={handleWhatsApp}
                        title="Отправить клиенту в WhatsApp"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/20"
                    >
                        <PaperPlaneTilt size={13} weight="fill" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(showcaseUrl, '_blank', 'noopener,noreferrer');
                        }}
                        title="Открыть страницу работы"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                    >
                        <ArrowSquareOut size={13} />
                    </button>
                </div>
            )}
        </div>
    );

    // Clicking the card opens the showcase for completed jobs
    if (isDone) {
        return (
            <Link href={showcaseUrl} target="_blank" rel="noopener noreferrer" className="block">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}

interface BatchGroup {
    batchId: string;
    jobs: Job[];
    createdAt: string;
}

function BatchGroupCard({ group }: { group: BatchGroup }): React.ReactElement {
    const { t } = useLanguage();
    const doneCount = group.jobs.filter((j) => j.status === 'DONE').length;
    const processingCount = group.jobs.filter((j) => j.status === 'PROCESSING' || j.status === 'PENDING').length;
    const failedCount = group.jobs.length - doneCount - processingCount;
    const overallStatus: JobStatus =
        processingCount > 0
            ? 'PROCESSING'
            : failedCount === group.jobs.length
                ? 'FAILED'
                : 'DONE';

    return (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            {/* Batch header */}
            <div className="flex items-center gap-3 border-b border-border/30 bg-muted/20 px-4 py-2.5">
                <Stack size={14} className="shrink-0 text-primary" />
                <span className="flex-1 text-xs font-semibold text-foreground">
                    {t('dashboard.batch_prefix')}{new Date(group.jobs[0].createdAt).toLocaleDateString(undefined)} ({group.jobs.length}{t('dashboard.batch_suffix')})
                </span>
                <StatusBadge status={overallStatus} />
            </div>
            {/* Batch job thumbnails */}
            <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:thin]">
                {group.jobs.map((job) => (
                    <div key={job.id} className="shrink-0">
                        <div className="relative h-14 w-10 overflow-hidden rounded-lg border border-border/30">
                            <Image src={getServerImageUrl(job.originalUrl)} alt="Original" fill unoptimized sizes="40px" className="object-cover" />
                        </div>
                        <div className="mt-1 flex justify-center">
                            {job.status === 'PROCESSING' || job.status === 'PENDING' ? (
                                <SpinnerGap size={10} className="animate-spin text-primary" />
                            ) : job.status === 'DONE' ? (
                                <CheckCircle size={10} className="text-green-600" weight="fill" />
                            ) : (
                                <WarningCircle size={10} className="text-destructive" weight="fill" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

type JobRow = { type: 'single'; job: Job } | { type: 'batch'; group: BatchGroup };

function buildRows(jobs: Job[]): JobRow[] {
    const batchMap = new Map<string, Job[]>();

    // First pass: collect all jobs per batchId
    for (const job of jobs) {
        if (job.batchId) {
            const existing = batchMap.get(job.batchId);
            if (existing) {
                existing.push(job);
            } else {
                batchMap.set(job.batchId, [job]);
            }
        }
    }

    // Second pass: build rows in original order, collapsing batch groups
    const seen = new Set<string>();
    const rows: JobRow[] = [];

    for (const job of jobs) {
        if (job.batchId) {
            if (!seen.has(job.batchId)) {
                seen.add(job.batchId);
                const batchJobs = batchMap.get(job.batchId) ?? [];
                rows.push({
                    type: 'batch',
                    group: {
                        batchId: job.batchId,
                        jobs: batchJobs,
                        createdAt: job.createdAt,
                    },
                });
            }
        } else {
            rows.push({ type: 'single', job });
        }
    }

    return rows;
}

export function JobHistoryList(): React.ReactElement {
    const { t } = useLanguage();
    const { data, isLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => jobService.getUserJobs(),
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        );
    }

    const jobs = data?.items ?? [];

    if (jobs.length === 0) {
        return (
            <div className="rounded-xl border border-border/50 bg-muted/30 p-12 text-center">
                <p className="text-muted-foreground">{t('dashboard.no_jobs')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('dashboard.upload_first')}
                </p>
            </div>
        );
    }

    const rows = buildRows(jobs);

    return (
        <div className="space-y-3">
            {rows.map((row) =>
                row.type === 'single' ? (
                    <SingleJobCard key={row.job.id} job={row.job} />
                ) : (
                    <BatchGroupCard key={row.group.batchId} group={row.group} />
                ),
            )}
        </div>
    );
}
