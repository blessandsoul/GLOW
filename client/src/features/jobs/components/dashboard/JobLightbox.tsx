'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, CaretLeft, CaretRight, DownloadSimple, ShareNetwork, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getServerImageUrl } from '@/lib/utils/image';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AddToPortfolioButton } from '@/features/portfolio/components/AddToPortfolioButton';
import { ROUTES } from '@/lib/constants/routes';
import { downloadImage } from '@/lib/utils/download';
import type { Job } from '../../types/job.types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
const NAV_BTN = 'absolute z-10 hidden items-center justify-center rounded-full bg-white/10 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/20 md:flex';
const ACTION_BTN = 'flex items-center justify-center rounded-full bg-white/10 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/20';

interface JobLightboxProps {
    jobs: Job[];
    initialJobIndex: number;
    open: boolean;
    onClose: () => void;
    onDelete: (jobId: string) => void;
}

export function JobLightbox({ jobs, initialJobIndex, open, onClose, onDelete }: JobLightboxProps): React.ReactElement | null {
    const { t } = useLanguage();
    const [currentJobIndex, setCurrentJobIndex] = useState(initialJobIndex);
    const [selectedVariant, setSelectedVariant] = useState(1); // 0 = original, 1+ = results
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);
    const touchStartY = useRef(0);
    const isDragging = useRef(false);
    const [translateX, setTranslateX] = useState(0);

    useEffect(() => {
        if (open) { setCurrentJobIndex(initialJobIndex); setSelectedVariant(1); }
    }, [open, initialJobIndex]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return (): void => { document.body.style.overflow = prev; };
    }, [open]);

    const goNextJob = useCallback((): void => {
        setCurrentJobIndex((i) => { if (i < jobs.length - 1) { setSelectedVariant(1); return i + 1; } return i; });
    }, [jobs.length]);

    const goPrevJob = useCallback((): void => {
        setCurrentJobIndex((i) => { if (i > 0) { setSelectedVariant(1); return i - 1; } return i; });
    }, []);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNextJob();
            if (e.key === 'ArrowLeft') goPrevJob();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onClose, goNextJob, goPrevJob]);

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
        if (Math.abs(dy) > Math.abs(dx) && dy > 60) {
            isDragging.current = false; setTranslateX(0); onClose(); return;
        }
        touchDeltaX.current = dx;
        setTranslateX(dx);
    }, [onClose]);

    const handleTouchEnd = useCallback((): void => {
        isDragging.current = false;
        if (touchDeltaX.current < -50) goNextJob();
        else if (touchDeltaX.current > 50) goPrevJob();
        setTranslateX(0);
    }, [goNextJob, goPrevJob]);

    if (!open || jobs.length === 0) return null;

    const safeIndex = Math.max(0, Math.min(currentJobIndex, jobs.length - 1));
    const job = jobs[safeIndex];
    const results = job.results ?? [];
    const variantUrls = [job.originalUrl, ...results];
    const safeVariant = Math.max(0, Math.min(selectedVariant, variantUrls.length - 1));
    const currentImageUrl = getServerImageUrl(variantUrls[safeVariant]);
    const stop = (e: React.MouseEvent): void => { e.stopPropagation(); };

    const handleDownload = (e: React.MouseEvent): void => {
        stop(e);
        const variant = safeVariant === 0 ? 0 : safeVariant - 1;
        const url = `${API_BASE}/jobs/${job.id}/download?variant=${variant}`;
        downloadImage(url, `glowge-${Date.now()}.jpg`).catch(() => {
            window.open(url, '_blank');
        });
    };
    const handleShare = (e: React.MouseEvent): void => {
        stop(e);
        navigator.clipboard.writeText(`${window.location.origin}${ROUTES.SHOWCASE(job.id)}`).then(() => toast.success(t('dashboard.link_copied')));
    };
    const handleDelete = (e: React.MouseEvent): void => {
        stop(e); onDelete(job.id); onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95" onClick={onClose} role="dialog" aria-modal="true" aria-label="Job image viewer">
            {/* Close */}
            <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="Close">
                <X size={20} className="text-white" />
            </button>
            {/* Counter */}
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                <span className="text-xs font-medium text-white/80 tabular-nums">{safeIndex + 1} / {jobs.length}</span>
            </div>
            {/* Prev arrow */}
            {safeIndex > 0 && (
                <button type="button" onClick={(e) => { stop(e); goPrevJob(); }} className={cn(NAV_BTN, 'left-3 top-1/2 -translate-y-1/2')} aria-label="Previous job">
                    <CaretLeft size={20} className="text-white" />
                </button>
            )}
            {/* Next arrow */}
            {safeIndex < jobs.length - 1 && (
                <button type="button" onClick={(e) => { stop(e); goNextJob(); }} className={cn(NAV_BTN, 'right-3 top-1/2 -translate-y-1/2')} aria-label="Next job">
                    <CaretRight size={20} className="text-white" />
                </button>
            )}
            {/* Main image */}
            <div className="relative flex h-full w-full items-center justify-center px-4 pb-28 pt-14 sm:pb-24 sm:pt-16" onClick={stop} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div className={cn('relative h-full w-full max-w-lg', !isDragging.current && 'transition-transform duration-200 ease-out')} style={{ transform: `translateX(${translateX}px)` }}>
                    <Image src={currentImageUrl} alt={`Job result ${safeVariant}`} fill className="object-contain" sizes="100vw" priority unoptimized />
                </div>
            </div>
            {/* Bottom panel: actions + thumbnails */}
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2" onClick={stop}>
                {/* Action buttons — horizontal row on mobile, vertical column on desktop side */}
                <div className="flex items-center gap-2 md:absolute md:bottom-20 md:right-4 md:flex-col">
                    <button type="button" onClick={handleDownload} className={ACTION_BTN} aria-label="Download">
                        <DownloadSimple size={20} className="text-white" />
                    </button>
                    <button type="button" onClick={handleShare} className={ACTION_BTN} aria-label="Share">
                        <ShareNetwork size={20} className="text-white" />
                    </button>
                    <AddToPortfolioButton jobId={job.id} imageUrl={variantUrls[safeVariant]} />
                    <button type="button" onClick={handleDelete} className="flex items-center justify-center rounded-full bg-destructive/20 p-2.5 transition-colors hover:bg-destructive/30" aria-label={t('dashboard.delete_btn')}>
                        <Trash size={20} className="text-destructive" />
                    </button>
                </div>

                {/* Variant thumbnails */}
                {results.length > 0 && (
                    <div className="flex justify-center gap-2">
                        {variantUrls.map((url, i) => (
                            <button key={i} type="button" onClick={() => setSelectedVariant(i)} className={cn('relative h-14 w-10 overflow-hidden rounded-lg transition-all duration-150 sm:h-16 sm:w-12', i === safeVariant ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-90')}>
                                <Image src={getServerImageUrl(url)} alt={i === 0 ? t('dashboard.original') : `${t('dashboard.variant')} ${i}`} fill className="object-cover" sizes="48px" unoptimized />
                                {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] font-medium text-white">{t('dashboard.original')}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
