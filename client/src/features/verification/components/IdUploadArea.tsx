'use client';

import React, { useRef } from 'react';
import { Upload, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/hooks/useLanguage';

interface IdUploadAreaProps {
    currentUrl: string | null;
    onUpload: (file: File) => void;
    isPending: boolean;
}

export function IdUploadArea({ currentUrl, onUpload, isPending }: IdUploadAreaProps): React.ReactElement {
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
    };

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('verification.id_document')}</p>

            {currentUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={currentUrl}
                        alt="ID document"
                        className="h-14 w-20 rounded object-cover border border-border/50"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                            <CheckCircle size={14} weight="fill" />
                            {t('verification.document_uploaded')}
                        </div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={isPending}
                            className="mt-1 text-xs text-muted-foreground underline hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            {t('verification.replace')}
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => !isPending && inputRef.current?.click()}
                    className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center transition-colors duration-200',
                        isPending
                            ? 'opacity-60 cursor-not-allowed'
                            : 'cursor-pointer hover:border-primary/40 hover:bg-primary/5',
                    )}
                >
                    {isPending ? (
                        <SpinnerGap size={22} className="animate-spin text-primary" />
                    ) : (
                        <Upload size={22} className="text-muted-foreground" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {isPending ? t('verification.uploading') : t('verification.upload_id')}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('verification.upload_id_hint')}
                        </p>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
