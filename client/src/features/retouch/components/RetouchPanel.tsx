'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Eraser } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { RetouchEditor } from './RetouchEditor';
import { RetouchComparison } from './RetouchComparison';
import { useRetouch } from '../hooks/useRetouch';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface RetouchPanelProps {
    jobId: string;
    imageUrl: string;
    onClose: () => void;
}

type PanelView = 'editor' | 'comparison';

export function RetouchPanel({ imageUrl, onClose }: RetouchPanelProps): React.ReactElement {
    const { t } = useLanguage();
    const [view, setView] = useState<PanelView>('editor');
    const { retouchJob, submitRetouch, isProcessing } = useRetouch(imageUrl);

    useEffect(() => {
        if (retouchJob?.retouchedUrl) {
            setView('comparison');
        }
    }, [retouchJob]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label={t('ui.text_gmmtbc')}>
                    <ArrowLeft size={16} />
                </Button>
                <div className="flex items-center gap-1.5">
                    <Eraser size={16} className="text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                        {view === 'editor' ? t('ui.text_eevzuf') : t('ui.text_loden0')}
                    </p>
                </div>
            </div>

            {/* Content */}
            {view === 'editor' && (
                <RetouchEditor
                    imageUrl={imageUrl}
                    onSubmit={submitRetouch}
                    isProcessing={isProcessing}
                />
            )}

            {view === 'comparison' && retouchJob?.retouchedUrl && (
                <>
                    <RetouchComparison
                        originalUrl={imageUrl}
                        retouchedUrl={retouchJob.retouchedUrl}
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => setView('editor')}
                        >
                            <Eraser size={12} />
                            {t('ui.text_flogs7')}</Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground"
                            onClick={onClose}
                        >
                            <ArrowLeft size={12} />
                            {t('ui.text_i4q27s')}</Button>
                    </div>
                </>
            )}
        </div>
    );
}
