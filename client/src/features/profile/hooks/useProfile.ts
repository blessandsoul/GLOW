'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { profileService } from '../services/profile.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { MasterProfile, ProfileFormData } from '../types/profile.types';

export function useProfile() {
    const { t } = useLanguage();
    const [profile, setProfile] = useState<MasterProfile | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await profileService.getProfile();
            setProfile(data);
        } catch (error) {
            console.error(error);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const save = async (formData: ProfileFormData) => {
        setIsSaving(true);
        try {
            await profileService.saveProfile(formData);
            await fetchProfile(); // refetch after save
            toast.success(t('system.sys_pvn3rc'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    return { profile, isLoading, save, isSaving };
}
