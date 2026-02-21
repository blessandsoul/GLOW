'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { captionService } from '../services/caption.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { Caption, CaptionLanguage } from '../types/caption.types';

export function useCaptions(jobId: string, languages: CaptionLanguage[] = ['RU']) {
    const { t } = useLanguage();
    const [captions, setCaptions] = useState<Caption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchCaptions = useCallback(async () => {
        if (!jobId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await captionService.getCaptions(jobId);
            setCaptions(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchCaptions();
    }, [fetchCaptions]);

    const generate = async () => {
        setIsGenerating(true);
        try {
            await captionService.generateCaptions(jobId, languages);
            await fetchCaptions();
            toast.success(t('system.sys_2nhhz5'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsGenerating(false);
        }
    };

    return { captions, isLoading, generate, isGenerating };
}
