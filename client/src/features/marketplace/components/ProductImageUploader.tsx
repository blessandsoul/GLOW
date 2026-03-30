'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Plus, X, SpinnerGap } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ProductImageUploaderProps {
    images: string[];
    onAdd: (file: File) => void;
    onRemove: (index: number) => void;
    isUploading?: boolean;
    maxImages?: number;
}

export function ProductImageUploader({
    images,
    onAdd,
    onRemove,
    isUploading,
    maxImages = 5,
}: ProductImageUploaderProps): React.ReactElement {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const file = e.target.files?.[0];
        if (file) {
            onAdd(file);
            e.target.value = '';
        }
    }

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
                Фотографии <span className="text-muted-foreground">({images.length}/{maxImages})</span>
            </label>
            <div className="flex flex-wrap gap-2">
                {images.map((url, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border/50 bg-muted">
                        <Image src={url} alt={`Фото ${i + 1}`} fill className="object-cover" sizes="80px" />
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white"
                        >
                            <X size={10} weight="bold" />
                        </button>
                    </div>
                ))}

                {images.length < maxImages && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className={cn(
                            'flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed',
                            'border-border/50 text-muted-foreground transition-colors',
                            'hover:border-primary/40 hover:text-primary',
                            isUploading && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        {isUploading ? (
                            <SpinnerGap size={16} className="animate-spin" />
                        ) : (
                            <>
                                <Plus size={16} />
                                <span className="text-[10px]">Добавить</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
            {images.length === 0 && (
                <p className="text-xs text-destructive">Минимум 1 фото</p>
            )}
        </div>
    );
}
