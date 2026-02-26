'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { UploadSimple, Sparkle, X, ImageSquare, ArrowsDownUp, Lightning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    isLoading: boolean;
    className?: string;
    hideGenerateButton?: boolean;
    onPendingFileChange?: (file: File | null) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export function UploadZone({ onFileSelect, isLoading, className, hideGenerateButton, onPendingFileChange }: UploadZoneProps): React.ReactElement {
    const { t } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFile = useCallback(
        (file: File) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error(t('ui.text_xw337b'));
                return;
            }
            if (file.size > MAX_SIZE) {
                toast.error(t('ui.text_t0p92c'));
                return;
            }
            const url = URL.createObjectURL(file);
            setPreview(url);
            setFileName(file.name);
            setPendingFile(file);
            onPendingFileChange?.(file);
            // Do NOT call onFileSelect here — wait for Generate button
        },
        [onPendingFileChange, t],
    );

    const handleGenerate = useCallback(() => {
        if (pendingFile) onFileSelect(pendingFile);
    }, [pendingFile, onFileSelect]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleClearPreview = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
            setFileName(null);
            setPendingFile(null);
            onPendingFileChange?.(null);
        },
        [preview, onPendingFileChange],
    );

    const truncatedName = useMemo(() => {
        if (!fileName) return null;
        if (fileName.length <= 22) return fileName;
        const ext = fileName.slice(fileName.lastIndexOf('.'));
        return fileName.slice(0, 17) + '…' + ext;
    }, [fileName]);

    // ── Preview state ──
    if (preview) {
        return (
            <div className={cn('flex flex-col items-center gap-2.5', className)}>
                <label className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
                    <input
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                    <div className="relative aspect-3/4 w-full">
                        <Image src={preview} alt={t('ui.text_jgpm5c')} fill className="object-cover" />

                        {/* Replace overlay */}
                        {!isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                                <div className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 scale-95">
                                    <ImageSquare size={13} className="text-foreground" />
                                    <span className="text-xs font-semibold text-foreground">{t('ui.text_bwsqzt')}</span>
                                </div>
                            </div>
                        )}

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                <Sparkle size={28} weight="fill" className="animate-pulse text-white" />
                            </div>
                        )}
                    </div>

                    {/* Clear button */}
                    {!isLoading && (
                        <button
                            type="button"
                            onClick={handleClearPreview}
                            aria-label={t('ui.text_vyzzv6')}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur-sm transition-all duration-150 hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <X size={12} weight="bold" />
                        </button>
                    )}
                </label>

                {truncatedName && !isLoading && (
                    <p className="max-w-full truncate text-[10px] text-muted-foreground/70">{truncatedName}</p>
                )}

                {/* Generate button */}
                {!hideGenerateButton && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isLoading || !pendingFile}
                        className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
                            'bg-primary text-primary-foreground text-sm font-semibold',
                            'transition-all duration-200 active:scale-[0.98]',
                            'hover:brightness-110 shadow-sm',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            'disabled:opacity-60 disabled:pointer-events-none',
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Sparkle size={16} weight="fill" className="animate-pulse" />
                                {t('upload.generating_btn')}
                            </>
                        ) : (
                            <>
                                <Lightning size={16} weight="fill" />
                                {t('upload.generate_btn')}
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }

    // ── Drop zone ──
    return (
        <label
            className={cn(
                'group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed',
                'w-full cursor-pointer transition-all duration-300 py-10 px-6 md:py-8',
                isDragging
                    ? 'border-primary bg-primary/5 shadow-inner scale-[1.01]'
                    : 'border-border/40 bg-transparent hover:border-primary/40 hover:bg-muted/30',
                isLoading && 'pointer-events-none opacity-60',
                className,
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                disabled={isLoading}
            />

            {/* Icon container */}
            <div className={cn(
                'flex h-14 w-14 md:h-12 md:w-12 items-center justify-center rounded-xl transition-all duration-300',
                isDragging
                    ? 'bg-primary/15 scale-105'
                    : 'bg-muted/60 group-hover:bg-primary/10',
            )}>
                {isLoading ? (
                    <Sparkle
                        size={22}
                        weight="fill"
                        className="animate-pulse text-primary"
                    />
                ) : isDragging ? (
                    <ArrowsDownUp size={22} className="text-primary" />
                ) : (
                    <UploadSimple
                        size={22}
                        className="text-muted-foreground transition-colors duration-200 group-hover:text-primary"
                    />
                )}
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-semibold text-foreground">
                    {isLoading ? t('ui.text_9idrvi') : isDragging ? t('ui.text_thy2du') : t('ui.text_wsl1xq')}
                </p>
                {!isLoading && (
                    <p className="text-xs text-muted-foreground">
                        {t('ui.text_l9wqx6')}</p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground/50">
                    {t('ui.text_sddu0c')}</p>
            </div>
        </label>
    );
}
