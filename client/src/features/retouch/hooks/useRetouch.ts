'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState } from 'react';
import { toast } from 'sonner';
import { retouchService } from '../services/retouch.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { RetouchJob, RetouchPoint } from '../types/retouch.types';

export function useRetouch(originalUrl: string): { retouchJob: RetouchJob | null; submitRetouch: (points: RetouchPoint[]) => void; isProcessing: boolean } {
    const { t } = useLanguage();
    const [retouchJob, setRetouchJob] = useState<RetouchJob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const submitRetouch = async (points: RetouchPoint[]) => {
        setIsProcessing(true);
        try {
            const data = await retouchService.submitRetouch(originalUrl, points);
            setRetouchJob(data);
            toast.success(t('system.sys_74j6sw'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsProcessing(false);
        }
    };

    return { retouchJob, submitRetouch, isProcessing };
}
