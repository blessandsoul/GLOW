'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { SpinnerGap, Sparkle, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RETOUCH_TYPE_LABELS } from '../types/retouch.types';
import type { RetouchPoint, RetouchType } from '../types/retouch.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { getServerImageUrl } from '@/lib/utils/image';

interface RetouchEditorProps {
    imageUrl: string;
    onSubmit: (points: RetouchPoint[]) => void;
    isProcessing: boolean;
}

export function RetouchEditor({ imageUrl, onSubmit, isProcessing }: RetouchEditorProps): React.ReactElement {
    const { t } = useLanguage();
    const [points, setPoints] = useState<RetouchPoint[]>([]);
    const [activeType, setActiveType] = useState<RetouchType>('GLUE_SPOT');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleImageClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isProcessing) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            const point: RetouchPoint = {
                id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                x,
                y,
                type: activeType,
            };
            setPoints((prev) => [...prev, point]);
        },
        [activeType, isProcessing],
    );

    const removePoint = useCallback((id: string) => {
        setPoints((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return (
        <div className="space-y-4">
            {/* Retouch type toolbar */}
            <div className="flex flex-wrap gap-1.5">
                {(Object.entries(RETOUCH_TYPE_LABELS) as [RetouchType, { label: string; emoji: string }][]).map(
                    ([type, meta]) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setActiveType(type)}
                            className={cn(
                                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                activeType === type
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'border border-border/50 bg-background text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span>{meta.emoji}</span>
                            {meta.label}
                        </button>
                    ),
                )}
            </div>

            {/* Image with points */}
            <div
                ref={containerRef}
                className="relative cursor-crosshair overflow-hidden rounded-xl border border-border/50"
                onClick={handleImageClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                }}
            >
                <div className="relative aspect-3/4">
                    <Image src={getServerImageUrl(imageUrl)} alt={t('ui.text_ko6wbc')} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                </div>

                {/* Point markers */}
                {points.map((point) => {
                    const meta = RETOUCH_TYPE_LABELS[point.type];
                    return (
                        <div
                            key={point.id}
                            className="absolute flex items-center justify-center"
                            style={{
                                left: `${point.x}%`,
                                top: `${point.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-destructive/80 text-xs shadow-lg animate-pulse">
                                {meta.emoji}
                            </div>
                        </div>
                    );
                })}

                {/* Hint overlay */}
                {points.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                        <p className="rounded-full bg-background/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                            {t('ui.text_vit3cq')}</p>
                    </div>
                )}
            </div>

            {/* Points list */}
            {points.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                        {t('ui.text_bi93ou')}{points.length}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {points.map((point, i) => {
                            const { t } = useLanguage();
                            const meta = RETOUCH_TYPE_LABELS[point.type];
                            return (
                                <div
                                    key={point.id}
                                    className="flex items-center gap-1 rounded-full border border-border/50 bg-card px-2.5 py-1"
                                >
                                    <span className="text-xs">{meta.emoji}</span>
                                    <span className="text-xs text-muted-foreground">#{i + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removePoint(point.id)}
                                        className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                                        aria-label={t('ui.text_z2f3ne')}
                                    >
                                        <Trash size={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Submit */}
            <Button
                className="w-full gap-1.5"
                onClick={() => onSubmit(points)}
                disabled={points.length === 0 || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <SpinnerGap size={16} className="animate-spin" />
                        {t('ui.text_azsmp2')}</>
                ) : (
                    <>
                        <Sparkle size={16} />
                        {t('ui.text_w5glk4')}{points.length})
                    </>
                )}
            </Button>
        </div>
    );
}
