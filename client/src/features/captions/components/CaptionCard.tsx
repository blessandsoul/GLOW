'use client';

import { useCallback } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { VARIANT_LABELS, LANGUAGES } from '../types/caption.types';
import type { Caption } from '../types/caption.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

interface CaptionCardProps {
    caption: Caption;
}

export function CaptionCard({ caption }: CaptionCardProps): React.ReactElement {
    const { t } = useLanguage();
    const [copiedText, setCopiedText] = useState(false);
    const [copiedTags, setCopiedTags] = useState(false);

    const meta = VARIANT_LABELS[caption.variant];
    const lang = LANGUAGES[caption.language];

    const handleCopyText = useCallback(async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(caption.text);
            setCopiedText(true);
            toast.success(t('ui.text_w6cnkr'));
            setTimeout(() => setCopiedText(false), 2000);
        } catch {
            toast.error(t('ui.text_v5k3op'));
        }
    }, [caption.text]);

    const handleCopyHashtags = useCallback(async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(caption.hashtags);
            setCopiedTags(true);
            toast.success(t('ui.text_t41e6w'));
            setTimeout(() => setCopiedTags(false), 2000);
        } catch {
            toast.error(t('ui.text_v5k3op'));
        }
    }, [caption.hashtags]);

    const handleCopyAll = useCallback(async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(`${caption.text}\n\n${caption.hashtags}`);
            toast.success(t('ui.text_luhkns'));
        } catch {
            toast.error(t('ui.text_v5k3op'));
        }
    }, [caption.text, caption.hashtags]);

    return (
        <div className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                            <span className="text-xs text-muted-foreground">{lang.flag}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopyAll}>
                    <Copy size={12} />
                    {t('ui.text_m7k2')}</Button>
            </div>

            {/* Caption text */}
            <div className="relative">
                <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm text-foreground leading-relaxed">
                    {caption.text}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={handleCopyText}
                    aria-label={t('ui.text_1acquk')}
                >
                    {copiedText ? (
                        <Check size={14} className="text-success" />
                    ) : (
                        <Copy size={14} />
                    )}
                </Button>
            </div>

            {/* Hashtags */}
            <div className="relative">
                <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted/30 p-3">
                    {caption.hashtags.split(' ').filter(Boolean).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={handleCopyHashtags}
                    aria-label={t('ui.text_334sz8')}
                >
                    {copiedTags ? (
                        <Check size={14} className="text-success" />
                    ) : (
                        <Copy size={14} />
                    )}
                </Button>
            </div>
        </div>
    );
}
