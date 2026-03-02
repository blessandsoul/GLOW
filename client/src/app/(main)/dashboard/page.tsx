'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { BulkActionBar } from '@/features/jobs/components/dashboard/BulkActionBar';
import { useDashboardGallery, useDeleteJob, useBulkDeleteJobs } from '@/features/jobs/hooks/useDashboard';
import { useGallerySelection } from '@/features/jobs/hooks/useGallerySelection';
import { useMyPortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { toast } from 'sonner';
import { downloadImage } from '@/lib/utils/download';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import type { JobStatus } from '@/features/jobs/types/job.types';

export default function DashboardPage(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();

    const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>(undefined);
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
        selectedIds,
        toggle,
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

    const handleDownload = useCallback(async (jobId: string): Promise<void> => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
        const url = `${apiBase}/jobs/${jobId}/download?variant=0`;
        try {
            await downloadImage(url, `glowge-${Date.now()}.jpg`);
        } catch {
            toast.error(t('ui.download_hd_failed'));
        }
    }, [t]);

    const handleHDDownload = useCallback(async (jobId: string): Promise<void> => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
        const url = `${apiBase}/jobs/${jobId}/download?variant=0&upscale=1`;
        const toastId = toast.loading(t('ui.download_hd_preparing'));
        try {
            await downloadImage(url, `glowge-hd-${Date.now()}.jpg`);
            toast.success(t('ui.download_hd_success'), { id: toastId });
        } catch {
            toast.error(t('ui.download_hd_failed'), { id: toastId });
        }
    }, [t]);

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
        <div className={cn(
            'container mx-auto max-w-6xl px-4 py-5 space-y-5 sm:py-6 sm:space-y-6',
            selectedIds.size > 0 && 'pb-28 sm:pb-24',
        )}>
            <DashboardStatsBar />

            <GalleryToolbar
                activeStatus={statusFilter}
                onStatusChange={handleStatusChange}
            />

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && jobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted sm:h-16 sm:w-16">
                        <ImageSquare size={36} className="text-muted-foreground sm:size-8" />
                    </div>
                    <p className="text-xl font-medium text-foreground sm:text-lg">{t('dashboard.no_results')}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground max-w-[260px]">{t('dashboard.upload_first')}</p>
                    <Button asChild className="mt-7 gap-1.5 w-full sm:w-auto min-h-[44px]">
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
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {jobs.map((job, index) => (
                            <GalleryCard
                                key={job.id}
                                job={job}
                                isSelected={selectedIds.has(job.id)}
                                isInPortfolio={portfolioJobIds.has(job.id)}
                                onSelect={() => toggle(job.id)}
                                onClick={() => router.push(ROUTES.CREATE_RESULT(job.id))}
                                onDelete={() => setDeleteTarget(job.id)}
                                onDownload={() => handleDownload(job.id)}
                                onHDDownload={() => handleHDDownload(job.id)}
                            />
                        ))}
                    </div>

                    {/* Load more */}
                    {hasNextPage && (
                        <div className="flex justify-center pt-3 sm:pt-2">
                            <Button
                                variant="outline"
                                disabled={isFetchingNextPage}
                                onClick={() => fetchNextPage()}
                                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:h-9"
                            >
                                {isFetchingNextPage ? '...' : t('dashboard.load_more')}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Selection bar */}
            {selectedIds.size > 0 && (
                <BulkActionBar
                    selectedCount={selectedIds.size}
                    totalCount={total}
                    onSelectAll={() => selectAll(jobs.map((j) => j.id))}
                    onDelete={handleRequestBulkDelete}
                    onCancel={clearSelection}
                    isDeleting={isDeletingBulk}
                />
            )}

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
