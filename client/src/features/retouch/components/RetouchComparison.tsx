'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface RetouchComparisonProps {
    originalUrl: string;
    retouchedUrl: string;
}

export function RetouchComparison({ originalUrl, retouchedUrl }: RetouchComparisonProps): React.ReactElement {
    const { t } = useLanguage();
    const [position, setPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const updatePosition = useCallback((clientX: number) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        setPosition(Math.max(0, Math.min(100, x)));
    }, []);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            isDragging.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updatePosition(e.clientX);
        },
        [updatePosition],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging.current) return;
            updatePosition(e.clientX);
        },
        [updatePosition],
    );

    const handlePointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    return (
        <div className="space-y-3">
            <div
                ref={containerRef}
                className="relative cursor-col-resize select-none overflow-hidden rounded-xl border border-border/50"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="relative aspect-3/4">
                    {/* Original (full width, bottom layer) */}
                    <Image
                        src={originalUrl}
                        alt={t('ui.text_usihek')}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />

                    {/* Retouched (clipped, top layer) */}
                    <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
                    >
                        <Image
                            src={retouchedUrl}
                            alt={t('ui.text_89w4ja')}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>

                    {/* Divider line */}
                    <div
                        className="absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-lg"
                        style={{ left: `${position}%` }}
                    >
                        {/* Handle */}
                        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-background/90 shadow-lg">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-foreground">
                                <path d="M1 6h10M4 3L1 6l3 3M8 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-3 left-3 z-10 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                        {t('ui.text_pt6')}</div>
                    <div className="absolute top-3 right-3 z-10 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                        {t('ui.text_gnzjzw')}</div>
                </div>
            </div>

            {/* Range input for accessibility / fine control */}
            <input
                type="range"
                min={0}
                max={100}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label={t('ui.text_668ns3')}
            />
        </div>
    );
}
