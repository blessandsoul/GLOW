'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, SpinnerGap, Sparkle, Lock } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { useCaption } from '../hooks/useCaptions';

const MAX_REGEN = 3;

interface CaptionGeneratorProps {
    jobId: string;
}

export function CaptionGenerator({ jobId }: CaptionGeneratorProps): React.ReactElement | null {
    const { caption, isLoading, isGenerating, generate, isGated, regenCount } = useCaption(jobId);
    const [copied, setCopied] = useState(false);

    const handleCopyAll = useCallback(async (): Promise<void> => {
        if (!caption) return;
        try {
            await navigator.clipboard.writeText(`${caption.text}\n\n${caption.hashtags}`);
            setCopied(true);
            toast.success('დაკოპირებულია!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('ვერ მოხერხდა კოპირება');
        }
    }, [caption]);

    if (isLoading) return null;

    // Subscription gate
    if (isGated) {
        return (
            <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" asChild>
                <Link href={ROUTES.DASHBOARD_CREDITS}>
                    <Lock size={14} />
                    AI ქეფშენი — PRO
                </Link>
            </Button>
        );
    }

    // No caption yet: inline generate button
    if (!caption) {
        return (
            <Button
                size="sm"
                className="gap-1.5"
                onClick={() => generate()}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <>
                        <SpinnerGap size={14} className="animate-spin" />
                        იქმნება...
                    </>
                ) : (
                    <>
                        <Sparkle size={14} />
                        AI ქეფშენი
                    </>
                )}
            </Button>
        );
    }

    // Caption exists: full-width block below action row
    return (
        <div className="w-full basis-full space-y-3 pt-1">
            <div className="whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
                {caption.text}
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted/30 p-3">
                {caption.hashtags
                    .split(' ')
                    .filter(Boolean)
                    .map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                        >
                            {tag}
                        </span>
                    ))}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyAll}>
                    {copied ? (
                        <Check size={14} className="text-success" />
                    ) : (
                        <Copy size={14} />
                    )}
                    {copied ? 'დაკოპირებულია!' : 'ტექსტის კოპირება'}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => generate(true)}
                    disabled={isGenerating || regenCount >= MAX_REGEN}
                >
                    {isGenerating ? (
                        <SpinnerGap size={14} className="animate-spin" />
                    ) : (
                        <Sparkle size={14} />
                    )}
                    ხელახლა
                </Button>
            </div>
        </div>
    );
}
