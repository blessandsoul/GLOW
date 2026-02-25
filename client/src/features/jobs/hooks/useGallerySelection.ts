'use client';

import { useState, useCallback } from 'react';

interface GallerySelectionReturn {
    selectedIds: Set<string>;
    isSelecting: boolean;
    toggle: (id: string) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;
    toggleSelectionMode: () => void;
}

export function useGallerySelection(): GallerySelectionReturn {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);

    const toggle = useCallback((id: string): void => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback((ids: string[]): void => {
        setSelectedIds(new Set(ids));
    }, []);

    const clearSelection = useCallback((): void => {
        setSelectedIds(new Set());
        setIsSelecting(false);
    }, []);

    const toggleSelectionMode = useCallback((): void => {
        setIsSelecting((prev) => {
            if (prev) {
                setSelectedIds(new Set());
            }
            return !prev;
        });
    }, []);

    return {
        selectedIds,
        isSelecting,
        toggle,
        selectAll,
        clearSelection,
        toggleSelectionMode,
    };
}
