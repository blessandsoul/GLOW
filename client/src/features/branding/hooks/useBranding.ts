'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { brandingService } from '../services/branding.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { BrandingFormData } from '../types/branding.types';

export function useBranding() {
    const { t } = useLanguage();
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await brandingService.getProfile();
            setProfile(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const save = async (data: BrandingFormData) => {
        setIsSaving(true);
        try {
            await brandingService.saveProfile(data);
            await fetchProfile();
            toast.success(t('system.sys_ns0wwy'));
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const remove = async () => {
        setIsRemoving(true);
        try {
            await brandingService.deleteProfile();
            await fetchProfile();
            toast.success(t('system.sys_q2ext5'));
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsRemoving(false);
        }
    };

    return { profile, isLoading, save, isSaving, remove, isRemoving };
}
