'use client';

import Image from 'next/image';
import { DownloadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { STORY_LAYOUT_LABELS } from '../types/story.types';
import type { GeneratedStory } from '../types/story.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface StoryPreviewCardProps {
    story: GeneratedStory;
}

export function StoryPreviewCard({ story }: StoryPreviewCardProps): React.ReactElement {
    const { t } = useLanguage();
    const meta = STORY_LAYOUT_LABELS[story.layout];

    const handleDownload = (): void => {
        const a = document.createElement('a');
        a.href = story.imageUrl;
        a.download = `glowge-story-${story.layout.toLowerCase()}-${Date.now()}.jpg`;
        a.click();
        toast.success(t('ui.text_dmbihz'));
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md">
            {/* Phone frame */}
            <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                <Image
                    src={story.imageUrl}
                    alt={meta.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 20vw"
                />

                {/* Overlay text */}
                {story.overlayText && (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-4 pb-6 pt-12">
                        <p className="text-center text-sm font-bold text-white drop-shadow-md">
                            {story.overlayText}
                        </p>
                    </div>
                )}

                {/* Download button on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-150 hover:scale-110 active:scale-95"
                        aria-label={t('ui.text_sqztsv')}
                    >
                        <DownloadSimple size={16} className="text-foreground" />
                    </button>
                </div>
            </div>

            {/* Label */}
            <div className="flex items-center gap-1.5 p-2.5">
                <span className="text-sm">{meta.emoji}</span>
                <div>
                    <p className="text-xs font-medium text-foreground">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                </div>
            </div>
        </div>
    );
}
