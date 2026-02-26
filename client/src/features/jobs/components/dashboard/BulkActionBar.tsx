'use client';

import { Trash, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface BulkActionBarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onDelete: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}

export function BulkActionBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onDelete,
    onCancel,
    isDeleting,
}: BulkActionBarProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200">
            <div className="container mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {selectedCount}/{totalCount}
                </span>

                <div className="flex-1 min-w-0" />

                <Button variant="outline" size="sm" onClick={onSelectAll} className="shrink-0 min-h-[40px] sm:min-h-0">
                    <span className="hidden sm:inline">{t('dashboard.select_all')}</span>
                    <span className="sm:hidden">All</span>
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedCount === 0 || isDeleting}
                    onClick={onDelete}
                    className="shrink-0 gap-1.5 min-h-[40px] sm:min-h-0"
                >
                    <Trash size={16} />
                    <span className="hidden sm:inline">{t('dashboard.delete_btn')}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel} className="shrink-0 min-h-[40px] sm:min-h-0">
                    <X size={16} />
                </Button>
            </div>
        </div>
    );
}
