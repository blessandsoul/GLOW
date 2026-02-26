'use client';

import { X } from '@phosphor-icons/react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { StylesGallery } from './StylesGallery';
import type { Style } from '../types/styles.types';

interface StyleDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (style: Style) => void;
    selectedId: string | null;
    trendStyles: Style[];
    isLoadingTrends: boolean;
}

export function StyleDrawer({
    open,
    onOpenChange,
    onSelect,
    selectedId,
    trendStyles,
    isLoadingTrends,
}: StyleDrawerProps): React.ReactElement {
    const { t } = useLanguage();

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85dvh]">
                <DrawerHeader className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                    <DrawerTitle className="text-base font-semibold">
                        {t('upload.style_title')}
                    </DrawerTitle>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        aria-label={t('ui.text_iqmmq2')}
                        className="rounded-full p-1.5 hover:bg-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </DrawerHeader>

                <div className="overflow-y-auto flex-1 px-4 pb-4 pt-3">
                    <StylesGallery
                        onSelect={(style) => {
                            onSelect(style);
                            setTimeout(() => onOpenChange(false), 200);
                        }}
                        selectedId={selectedId}
                        trendStyles={trendStyles}
                        isLoadingTrends={isLoadingTrends}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
