'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { captionService } from '../services/caption.service';
import { getErrorMessage, isErrorCode } from '@/lib/utils/error';
import type { Caption } from '../types/caption.types';

interface UseCaptionReturn {
    caption: Caption | null;
    isLoading: boolean;
    isGenerating: boolean;
    isGated: boolean;
    regenCount: number;
    generate: (force?: boolean) => Promise<void>;
}

export function useCaption(jobId: string): UseCaptionReturn {
    const [caption, setCaption] = useState<Caption | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGated, setIsGated] = useState(false);
    const [regenCount, setRegenCount] = useState(0);

    // On mount, check if a caption already exists (cached server-side)
    useEffect(() => {
        if (!jobId) {
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        (async (): Promise<void> => {
            try {
                const existing = await captionService.getCaption(jobId);
                if (!cancelled && existing) {
                    setCaption(existing);
                }
            } catch {
                // No cached caption — that's fine
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return (): void => { cancelled = true; };
    }, [jobId]);

    const generate = useCallback(async (force: boolean = false): Promise<void> => {
        setIsGenerating(true);
        setIsGated(false);
        try {
            const result = await captionService.generateCaption(jobId, force);
            setCaption(result);
            if (force) {
                setRegenCount((prev) => prev + 1);
            }
            toast.success('ქეფშენი შეიქმნა!');
        } catch (error) {
            if (isErrorCode(error, 'CAPTIONS_NOT_ENABLED')) {
                setIsGated(true);
            } else if (isErrorCode(error, 'CAPTION_REGEN_LIMIT')) {
                toast.error('მაქსიმალური რეგენერაციები ამოიწურა (3)');
            } else {
                toast.error(getErrorMessage(error));
            }
        } finally {
            setIsGenerating(false);
        }
    }, [jobId]);

    return { caption, isLoading, isGenerating, isGated, regenCount, generate };
}
