'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useShowcase } from '../hooks/useShowcase';
import { ShowcaseShare } from './ShowcaseShare';
import { ShowcaseReviewForm } from './ShowcaseReviewForm';
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { getServerImageUrl } from '@/lib/utils/image';

interface ShowcaseViewProps {
    jobId: string;
}

export function ShowcaseView({ jobId }: ShowcaseViewProps): React.ReactElement {
    const { t } = useLanguage();
    const { showcase, isLoading, isError } = useShowcase(jobId);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToIndex = useCallback((index: number): void => {
        const container = scrollRef.current;
        if (!container) return;
        const child = container.children[index] as HTMLElement | undefined;
        if (!child) return;
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setActiveIndex(index);
    }, []);

    const handleScroll = useCallback((): void => {
        const container = scrollRef.current;
        if (!container) return;
        const scrollLeft = container.scrollLeft;
        const width = container.clientWidth;
        const newIndex = Math.round(scrollLeft / width);
        setActiveIndex(newIndex);
    }, []);

    const handleClose = useCallback((): void => {
        window.close();
    }, []);

    const handlePrev = useCallback((): void => {
        if (activeIndex > 0) {
            scrollToIndex(activeIndex - 1);
        }
    }, [activeIndex, scrollToIndex]);

    const handleNext = useCallback((): void => {
        if (showcase && activeIndex < showcase.results.length - 1) {
            scrollToIndex(activeIndex + 1);
        }
    }, [activeIndex, showcase, scrollToIndex]);

    if (isLoading) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center bg-background">
                <Skeleton className="aspect-3/4 w-full max-w-md rounded-xl" />
            </div>
        );
    }

    if (isError || !showcase) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4">
                <p className="text-lg font-semibold text-foreground">
                    {t('ui.text_5kw2qk')}</p>
                <p className="text-sm text-muted-foreground">
                    {t('ui.text_nypwdd')}</p>
            </div>
        );
    }

    const results = showcase.results;

    return (
        <div className="relative flex min-h-dvh flex-col bg-background">
            {/* Header */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
                <div>
                    <p className="text-sm font-semibold text-foreground drop-shadow-sm">
                        {showcase.masterName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Powered by Glow.GE
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="rounded-full bg-muted/80 backdrop-blur-sm"
                    aria-label={t('ui.text_iqmmq2')}
                >
                    <X size={20} />
                </Button>
            </div>

            {/* Image gallery */}
            <div className="relative flex flex-1 items-center">
                {/* Navigation arrows (desktop) */}
                {activeIndex > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrev}
                        className="absolute left-2 z-10 hidden rounded-full bg-muted/80 backdrop-blur-sm sm:flex"
                        aria-label={t('ui.text_jfswzd')}
                    >
                        <CaretLeft size={20} />
                    </Button>
                )}
                {activeIndex < results.length - 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        className="absolute right-2 z-10 hidden rounded-full bg-muted/80 backdrop-blur-sm sm:flex"
                        aria-label={t('ui.text_gtwkv')}
                    >
                        <CaretRight size={20} />
                    </Button>
                )}

                {/* Scrollable gallery */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {results.map((url, i) => (
                        <div
                            key={i}
                            className="flex w-full flex-shrink-0 snap-center items-center justify-center px-4 pt-16 pb-4"
                        >
                            <div className="relative aspect-3/4 w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
                                <Image
                                    src={getServerImageUrl(url)}
                                    alt={`Результат ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 448px"
                                    priority={i === 0}
                                    unoptimized
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Indicator dots */}
            <div className="flex items-center justify-center gap-2 py-3">
                {results.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => scrollToIndex(i)}
                        className={cn(
                            'h-2 rounded-full transition-all duration-200',
                            i === activeIndex
                                ? 'w-6 bg-primary'
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        )}
                        aria-label={`Фото ${i + 1}`}
                    />
                ))}
            </div>

            {/* Share & Review section */}
            <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-8">
                <ShowcaseShare jobId={jobId} />
                <ShowcaseReviewForm jobId={jobId} />
            </div>
        </div>
    );
}
