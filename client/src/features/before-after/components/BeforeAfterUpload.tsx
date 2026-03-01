'use client';

import { useCallback, useState, useMemo } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { UploadSimple, X, ImageSquare, ArrowRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface BeforeAfterUploadProps {
    onSubmit: (beforeFile: File, afterFile: File) => void;
    isLoading: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 10 * 1024 * 1024;

function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('system.sys_lbrevv');
        return false;
    }
    if (file.size > MAX_SIZE) {
        toast.error('system.sys_49fni8');
        return false;
    }
    return true;
}

export function BeforeAfterUpload({ onSubmit, isLoading }: BeforeAfterUploadProps): React.ReactElement {
    const { t } = useLanguage();
    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);
    const [beforePreview, setBeforePreview] = useState<string | null>(null);
    const [afterPreview, setAfterPreview] = useState<string | null>(null);

    const canSubmit = useMemo(() => !!beforeFile && !!afterFile && !isLoading, [beforeFile, afterFile, isLoading]);

    const handleFile = useCallback((file: File, slot: 'before' | 'after') => {
        if (!validateFile(file)) return;
        const url = URL.createObjectURL(file);
        if (slot === 'before') {
            if (beforePreview) URL.revokeObjectURL(beforePreview);
            setBeforeFile(file);
            setBeforePreview(url);
        } else {
            if (afterPreview) URL.revokeObjectURL(afterPreview);
            setAfterFile(file);
            setAfterPreview(url);
        }
    }, [beforePreview, afterPreview]);

    const handleClear = useCallback((slot: 'before' | 'after') => {
        if (slot === 'before') {
            if (beforePreview) URL.revokeObjectURL(beforePreview);
            setBeforeFile(null);
            setBeforePreview(null);
        } else {
            if (afterPreview) URL.revokeObjectURL(afterPreview);
            setAfterFile(null);
            setAfterPreview(null);
        }
    }, [beforePreview, afterPreview]);

    const handleSubmit = useCallback(() => {
        if (beforeFile && afterFile) {
            onSubmit(beforeFile, afterFile);
        }
    }, [beforeFile, afterFile, onSubmit]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <DropSlot
                    label={t('ui.text_pt6')}
                    sublabel={t('ui.text_1nxbye')}
                    preview={beforePreview}
                    isLoading={isLoading}
                    onFile={(f) => handleFile(f, 'before')}
                    onClear={() => handleClear('before')}
                />
                <DropSlot
                    label={t('ui.text_gnzjzw')}
                    sublabel={t('ui.text_l3eq6g')}
                    preview={afterPreview}
                    isLoading={isLoading}
                    onFile={(f) => handleFile(f, 'after')}
                    onClear={() => handleClear('after')}
                />
            </div>

            <Button
                size="sm"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="w-full gap-1.5"
            >
                {isLoading ? t('ui.text_9idrvi') : t('ui.text_rms2jv')}
                {!isLoading && <ArrowRight size={14} />}
            </Button>

            <p className="text-center text-[10px] text-muted-foreground/70">
                {t('ui.text_poqzdd')}</p>
        </div>
    );
}

// ─── Single drop slot ───────────────────────────────────────────────────────

interface DropSlotProps {
    label: string;
    sublabel: string;
    preview: string | null;
    isLoading: boolean;
    onFile: (file: File) => void;
    onClear: () => void;
}

function DropSlot({ label, sublabel, preview, isLoading, onFile, onClear }: DropSlotProps): React.ReactElement {
    const { t } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
    }, [onFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
    }, [onFile]);

    if (preview) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-border/50">
                <label className="group cursor-pointer block">
                    <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                        onChange={handleChange} disabled={isLoading} />
                    <div className="relative aspect-3/4">
                        <Image src={preview} alt={label} fill className="object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                            <div className="flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                <ImageSquare size={12} />
                                <span className="text-[10px] font-medium">{t('ui.text_bwsqzt')}</span>
                            </div>
                        </div>
                    </div>
                </label>
                <button type="button" onClick={() => onClear()}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm transition hover:bg-destructive hover:text-destructive-foreground"
                    aria-label={`Убрать фото ${label.toLowerCase()}`}>
                    <X size={12} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">{label}</span>
                </div>
            </div>
        );
    }

    return (
        <label
            className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed aspect-3/4',
                'cursor-pointer transition-all duration-200 px-3',
                'border-border/50 bg-muted/20',
                isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'hover:border-primary/40 hover:bg-muted/40',
                isLoading && 'pointer-events-none opacity-50',
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                onChange={handleChange} disabled={isLoading} />
            <div className="rounded-full bg-primary/10 p-2.5">
                <UploadSimple size={16} className="text-primary" />
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{sublabel}</p>
            </div>
        </label>
    );
}
