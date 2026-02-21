'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { storyService } from '../services/story.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { GeneratedStory } from '../types/story.types';

export function useStories(jobId: string) {
    const { t } = useLanguage();
    const [stories, setStories] = useState<GeneratedStory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchStories = useCallback(async () => {
        if (!jobId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await storyService.getStories(jobId);
            setStories(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const generate = async () => {
        setIsGenerating(true);
        try {
            await storyService.generateStories(jobId);
            await fetchStories();
            toast.success(t('system.sys_54thy9'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsGenerating(false);
        }
    };

    return { stories, isLoading, generate, isGenerating };
}
