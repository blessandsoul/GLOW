'use client';

import { DeviceMobile, SpinnerGap, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStories } from '../hooks/useStories';
import { StoryPreviewCard } from './StoryPreviewCard';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface StoriesGeneratorProps {
    jobId: string;
}

export function StoriesGenerator({ jobId }: StoriesGeneratorProps): React.ReactElement {
    const { t } = useLanguage();
    const { stories, isLoading, generate, isGenerating } = useStories(jobId);

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />
                ))}
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/50 bg-muted/20 py-10">
                <div className="rounded-full bg-primary/10 p-4">
                    <DeviceMobile size={32} className="text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                        Instagram Stories
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('ui.text_59t87a')}</p>
                </div>
                <Button
                    onClick={() => generate()}
                    disabled={isGenerating}
                    className="gap-1.5"
                >
                    {isGenerating ? (
                        <>
                            <SpinnerGap size={16} className="animate-spin" />
                            {t('ui.text_rugjhy')}</>
                    ) : (
                        <>
                            <Sparkle size={16} />
                            {t('ui.text_votwmr')}</>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-base font-semibold text-foreground">{t('ui.text_mv03kd')}</p>
                    <p className="text-sm text-muted-foreground">{t('ui.text_9lruav')}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generate()}
                    disabled={isGenerating}
                    className="gap-1.5"
                >
                    {isGenerating ? (
                        <SpinnerGap size={14} className="animate-spin" />
                    ) : (
                        <Sparkle size={14} />
                    )}
                    {t('ui.text_eey4r')}</Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {stories.map((story) => (
                    <StoryPreviewCard key={story.id} story={story} />
                ))}
            </div>
        </div>
    );
}
