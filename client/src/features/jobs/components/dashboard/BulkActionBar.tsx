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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200">
            <div className="container mx-auto flex max-w-6xl items-center gap-3">
                <span className="text-sm font-medium">
                    {selectedCount} / {totalCount} {t('dashboard.selected_count')}
                </span>

                <div className="flex-1" />

                <Button variant="outline" size="sm" onClick={onSelectAll}>
                    {t('dashboard.select_all')}
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedCount === 0 || isDeleting}
                    onClick={onDelete}
                    className="gap-1.5"
                >
                    <Trash size={16} />
                    {t('dashboard.delete_btn')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5">
                    <X size={16} />
                    {t('dashboard.cancel')}
                </Button>
            </div>
        </div>
    );
}
