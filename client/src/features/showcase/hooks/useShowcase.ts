'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { showcaseService } from '../services/showcase.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { ShowcaseData, ReviewFormData, Review } from '../types/showcase.types';

export function useShowcase(jobId: string) {
    const [showcase, setShowcase] = useState<ShowcaseData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!jobId) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const fetchShowcase = async () => {
            setIsLoading(true);
            setIsError(false);
            try {
                const data = await showcaseService.getShowcase(jobId);
                if (isMounted) setShowcase(data);
            } catch (error) {
                if (isMounted) setIsError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchShowcase();
        return () => { isMounted = false; };
    }, [jobId]);

    return { showcase, isLoading, isError };
}

export function useSubmitReview(jobId: string) {
    const { t } = useLanguage();
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [review, setReview] = useState<Review | undefined>(undefined);

    const submitReview = async (formData: ReviewFormData) => {
        setIsPending(true);
        setIsSuccess(false);
        try {
            const data = await showcaseService.submitReview(jobId, formData);
            setReview(data);
            setIsSuccess(true);
            toast.success(t('system.sys_r2f9gv'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsPending(false);
        }
    };

    return { submitReview, isPending, isSuccess, review };
}
