'use client';

import { CheckSquare, Trash, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { JobStatus } from '../../types/job.types';

interface GalleryToolbarProps {
    activeStatus: JobStatus | undefined;
    onStatusChange: (status: JobStatus | undefined) => void;
    isSelecting: boolean;
    selectedCount: number;
    onToggleSelect: () => void;
    onBulkDelete: () => void;
    isBulkDeleting: boolean;
}

export function GalleryToolbar({
    activeStatus,
    onStatusChange,
    isSelecting,
    selectedCount,
    onToggleSelect,
    onBulkDelete,
    isBulkDeleting,
}: GalleryToolbarProps): React.ReactElement {
    const { t } = useLanguage();

    const statusFilters: { label: string; value: JobStatus | undefined }[] = [
        { label: t('dashboard.filter_all'), value: undefined },
        { label: t('dashboard.filter_done'), value: 'DONE' },
        { label: t('dashboard.filter_processing'), value: 'PROCESSING' },
        { label: t('dashboard.filter_failed'), value: 'FAILED' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => (
                <button
                    key={filter.label}
                    type="button"
                    onClick={() => onStatusChange(filter.value)}
                    className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                        activeStatus === filter.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                >
                    {filter.label}
                </button>
            ))}

            <div className="flex-1" />

            {!isSelecting ? (
                <Button variant="outline" size="sm" onClick={onToggleSelect} className="gap-1.5">
                    <CheckSquare size={16} />
                    {t('dashboard.select')}
                </Button>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {selectedCount} {t('dashboard.selected_count')}
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedCount === 0 || isBulkDeleting}
                        onClick={onBulkDelete}
                        className="gap-1.5"
                    >
                        <Trash size={16} />
                        {t('dashboard.delete_btn')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onToggleSelect} className="gap-1.5">
                        <X size={16} />
                        {t('dashboard.cancel')}
                    </Button>
                </div>
            )}
        </div>
    );
}
