'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, CaretLeft, CaretRight, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ImageEditor } from '@/components/common/ImageEditor';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { getServerImageUrl, base64ToFile } from '@/lib/utils/image';

interface LightboxImage {
    imageUrl: string;
    title: string | null;
}

interface ImageLightboxProps {
    images: LightboxImage[];
    initialIndex: number;
    open: boolean;
    onClose: () => void;
    editable?: boolean;
    onSaveEdited?: (imageIndex: number, file: File) => Promise<void>;
}

export function ImageLightbox({ images, initialIndex, open, onClose, editable = true, onSaveEdited }: ImageLightboxProps): React.ReactElement | null {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [editorOpen, setEditorOpen] = useState(false);
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);
    const touchStartY = useRef(0);
    const isDragging = useRef(false);
    const [translateX, setTranslateX] = useState(0);

    // Sync index when opening with a new initialIndex
    useEffect(() => {
        if (open) setCurrentIndex(initialIndex);
    }, [open, initialIndex]);

    // Lock body scroll + setup image server connection
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Preconnect to image server
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = new URL(getServerImageUrl(images[0]?.imageUrl || '')).origin;
        document.head.appendChild(preconnect);

        return () => { document.body.style.overflow = original; };
    }, [open, images]);

    // Preload all images aggressively
    useEffect(() => {
        if (!open || images.length === 0) return;

        // Preload current and next 3 images immediately
        const indicesToPreload = [
            currentIndex,
            currentIndex + 1,
            currentIndex + 2,
            currentIndex + 3,
        ].filter(i => i >= 0 && i < images.length);

        indicesToPreload.forEach((i, priority) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = getServerImageUrl(images[i].imageUrl);
            link.fetchPriority = priority === 0 ? 'high' : 'low';
            document.head.appendChild(link);
        });

        // Also preload previous 2 images
        [currentIndex - 1, currentIndex - 2]
            .filter(i => i >= 0 && i < images.length)
            .forEach(i => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = getServerImageUrl(images[i].imageUrl);
                link.fetchPriority = 'low';
                document.head.appendChild(link);
            });
    }, [currentIndex, open, images]);

    const goNext = useCallback((): void => {
        setCurrentIndex((i) => {
            const next = i < images.length - 1 ? i + 1 : i;
            return next;
        });
    }, [images.length]);

    const goPrev = useCallback((): void => {
        setCurrentIndex((i) => {
            const prev = i > 0 ? i - 1 : i;
            return prev;
        });
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onClose, goNext, goPrev]);

    const handleTouchStart = useCallback((e: React.TouchEvent): void => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchDeltaX.current = 0;
        isDragging.current = true;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent): void => {
        if (!isDragging.current) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;

        // If vertical swipe is dominant, close on swipe-down
        if (Math.abs(dy) > Math.abs(dx) && dy > 60) {
            isDragging.current = false;
            setTranslateX(0);
            onClose();
            return;
        }

        touchDeltaX.current = dx;
        setTranslateX(dx);
    }, [onClose]);

    const handleTouchEnd = useCallback((): void => {
        isDragging.current = false;
        const threshold = 50;
        if (touchDeltaX.current < -threshold) {
            goNext();
        } else if (touchDeltaX.current > threshold) {
            goPrev();
        }
        setTranslateX(0);
    }, [goNext, goPrev]);

    const handleEditorSave = useCallback(async (editedImageObject: { imageBase64?: string }) => {
        if (!editedImageObject.imageBase64) return;

        if (onSaveEdited) {
            try {
                const file = base64ToFile(editedImageObject.imageBase64, `glowge-edited-${Date.now()}.png`);
                await onSaveEdited(currentIndex, file);
                toast.success(t('ui.image_saved'));
            } catch {
                toast.error(t('ui.image_save_failed'));
            }
        } else {
            // Fallback: download locally
            const link = document.createElement('a');
            link.href = editedImageObject.imageBase64;
            link.download = `glowge-edited-${Date.now()}.png`;
            link.click();
            toast.success(t('ui.image_saved'));
        }
        setEditorOpen(false);
    }, [t, onSaveEdited, currentIndex]);

    if (!open || images.length === 0) return null;

    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    const current = images[safeIndex];

    return createPortal(
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
        >
            {/* Top-right actions */}
            <div className="absolute right-3 top-3 z-10 flex gap-2">
                {editable && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditorOpen(true); }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                        aria-label={t('ui.edit_image')}
                    >
                        <PencilSimple size={20} className="text-white" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                    aria-label="Close"
                >
                    <X size={20} className="text-white" />
                </button>
            </div>

            {/* Counter */}
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                <span className="text-xs font-medium text-white/80 tabular-nums">
                    {currentIndex + 1} / {images.length}
                </span>
            </div>

            {/* Prev button — desktop only */}
            {currentIndex > 0 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
                    aria-label="Previous image"
                >
                    <CaretLeft size={20} className="text-white" />
                </button>
            )}

            {/* Next button — desktop only */}
            {currentIndex < images.length - 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
                    aria-label="Next image"
                >
                    <CaretRight size={20} className="text-white" />
                </button>
            )}

            {/* Image area with swipe */}
            <div
                className="flex h-full w-full items-center justify-center px-4 py-12 sm:px-14 sm:py-14 will-change-transform"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={cn(
                        'relative h-full w-full max-w-lg flex items-center justify-center',
                        !isDragging.current && 'transition-transform duration-150 ease-out',
                    )}
                    style={{ transform: `translateX(${translateX}px)` }}
                >
                    <img
                        key={safeIndex}
                        src={getServerImageUrl(current.imageUrl)}
                        alt={current.title ?? 'Portfolio image'}
                        className="max-h-full max-w-full object-contain will-change-transform"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </div>

            {/* Title overlay */}
            {current.title && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-4 pb-6 pt-12">
                    <p className="text-center text-sm font-medium text-white">
                        {current.title}
                    </p>
                </div>
            )}

            {/* Dot indicators — mobile */}
            {images.length > 1 && images.length <= 10 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:hidden">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-200',
                                i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40',
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Image editor */}
            <ImageEditor
                source={getServerImageUrl(current.imageUrl)}
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSave={handleEditorSave}
            />
        </div>,
        document.body,
    );
}
