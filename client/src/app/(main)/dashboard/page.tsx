'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, ImageSquare } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DashboardStatsBar } from '@/features/jobs/components/dashboard/DashboardStatsBar';
import { GalleryToolbar } from '@/features/jobs/components/dashboard/GalleryToolbar';
import { GalleryCard } from '@/features/jobs/components/dashboard/GalleryCard';
import { JobLightbox } from '@/features/jobs/components/dashboard/JobLightbox';
import { BulkActionBar } from '@/features/jobs/components/dashboard/BulkActionBar';
import { useDashboardGallery, useDeleteJob, useBulkDeleteJobs } from '@/features/jobs/hooks/useDashboard';
import { useGallerySelection } from '@/features/jobs/hooks/useGallerySelection';
import { useMyPortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import type { JobStatus } from '@/features/jobs/types/job.types';

export default function DashboardPage(): React.ReactElement {
    const { t } = useLanguage();

    const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>(undefined);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [bulkDeletePending, setBulkDeletePending] = useState(false);

    const {
        jobs,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useDashboardGallery({ status: statusFilter, limit: 20 });
    const { mutate: deleteJob } = useDeleteJob();
    const { mutate: bulkDelete, isPending: isDeletingBulk } = useBulkDeleteJobs();
    const {
        isSelecting,
        selectedIds,
        toggle,
        toggleSelectionMode,
        selectAll,
        clearSelection,
    } = useGallerySelection();
    const { items: portfolioItems } = useMyPortfolio();
    const portfolioJobIds = useMemo(
        () => new Set(portfolioItems.filter((item) => item.jobId).map((item) => item.jobId)),
        [portfolioItems],
    );

    const handleStatusChange = useCallback((s: JobStatus | undefined): void => {
        setStatusFilter(s);
    }, []);

    const handleDownload = useCallback((jobId: string): void => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
        window.open(`${apiBase}/jobs/${jobId}/download?variant=0`, '_blank');
    }, []);

    const handleConfirmDelete = useCallback((): void => {
        if (deleteTarget) {
            deleteJob(deleteTarget);
            setDeleteTarget(null);
        }
    }, [deleteTarget, deleteJob]);

    const handleRequestBulkDelete = useCallback((): void => {
        if (selectedIds.size > 0) {
            setBulkDeletePending(true);
        }
    }, [selectedIds.size]);

    const handleConfirmBulkDelete = useCallback((): void => {
        bulkDelete(Array.from(selectedIds));
        clearSelection();
        setBulkDeletePending(false);
    }, [bulkDelete, selectedIds, clearSelection]);

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
            <DashboardStatsBar />

            <GalleryToolbar
                activeStatus={statusFilter}
                onStatusChange={handleStatusChange}
                isSelecting={isSelecting}
                selectedCount={selectedIds.size}
                onToggleSelect={toggleSelectionMode}
                onBulkDelete={handleRequestBulkDelete}
                isBulkDeleting={isDeletingBulk}
            />

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && jobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <ImageSquare size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground">{t('dashboard.no_results')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.upload_first')}</p>
                    <Button asChild className="mt-6 gap-1.5">
                        <Link href={ROUTES.CREATE}>
                            <Plus size={16} />
                            {t('dashboard.new_photo')}
                        </Link>
                    </Button>
                </div>
            )}

            {/* Image grid */}
            {!isLoading && jobs.length > 0 && (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {jobs.map((job, index) => (
                            <GalleryCard
                                key={job.id}
                                job={job}
                                isSelecting={isSelecting}
                                isSelected={selectedIds.has(job.id)}
                                isInPortfolio={portfolioJobIds.has(job.id)}
                                onSelect={() => toggle(job.id)}
                                onClick={() => setLightboxIndex(index)}
                                onDelete={() => setDeleteTarget(job.id)}
                                onDownload={() => handleDownload(job.id)}
                            />
                        ))}
                    </div>

                    {/* Load more */}
                    {hasNextPage && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isFetchingNextPage}
                                onClick={() => fetchNextPage()}
                            >
                                {isFetchingNextPage ? '...' : t('dashboard.load_more')}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Selection bar */}
            {isSelecting && (
                <BulkActionBar
                    selectedCount={selectedIds.size}
                    totalCount={total}
                    onSelectAll={() => selectAll(jobs.map((j) => j.id))}
                    onDelete={handleRequestBulkDelete}
                    onCancel={clearSelection}
                    isDeleting={isDeletingBulk}
                />
            )}

            {/* Lightbox */}
            <JobLightbox
                jobs={jobs}
                initialJobIndex={lightboxIndex ?? 0}
                open={lightboxIndex !== null}
                onClose={() => setLightboxIndex(null)}
                onDelete={(jobId) => setDeleteTarget(jobId)}
            />

            {/* Single delete confirmation dialog */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dashboard.delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('dashboard.delete_confirm_desc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('dashboard.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('dashboard.delete_btn')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk delete confirmation dialog */}
            <AlertDialog open={bulkDeletePending} onOpenChange={(open) => { if (!open) setBulkDeletePending(false); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dashboard.bulk_delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('dashboard.bulk_delete_confirm_desc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('dashboard.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmBulkDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('dashboard.delete_btn')} ({selectedIds.size})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
