'use client';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { JobStatus } from '../../types/job.types';

interface GalleryToolbarProps {
    activeStatus: JobStatus | undefined;
    onStatusChange: (status: JobStatus | undefined) => void;
}

export function GalleryToolbar({
    activeStatus,
    onStatusChange,
}: GalleryToolbarProps): React.ReactElement {
    const { t } = useLanguage();

    const statusFilters: { label: string; value: JobStatus | undefined }[] = [
        { label: t('dashboard.filter_all'), value: undefined },
        { label: t('dashboard.filter_done'), value: 'DONE' },
        { label: t('dashboard.filter_processing'), value: 'PROCESSING' },
        { label: t('dashboard.filter_failed'), value: 'FAILED' },
    ];

    return (
        <div className="min-w-0 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)] sm:[mask-image:none]">
            <div className="flex items-center gap-2 sm:gap-2 w-max">
                {statusFilters.map((filter) => (
                    <button
                        key={filter.label}
                        type="button"
                        onClick={() => onStatusChange(filter.value)}
                        className={cn(
                            'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            activeStatus === filter.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
