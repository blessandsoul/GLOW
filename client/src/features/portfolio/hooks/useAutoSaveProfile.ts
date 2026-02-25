'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { profileService } from '@/features/profile/services/profile.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { ProfileFormData } from '@/features/profile/types/profile.types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSaveProfile(initialData: ProfileFormData): {
    form: ProfileFormData;
    updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
    saveStatus: SaveStatus;
    saveNow: () => Promise<void>;
} {
    const [form, setForm] = useState<ProfileFormData>(initialData);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const debouncedForm = useDebounce(form, 1500);
    const lastSavedRef = useRef<string>(JSON.stringify(initialData));
    const isInitialMount = useRef(true);

    // Sync when initial data changes (e.g., after fetch)
    useEffect(() => {
        setForm(initialData);
        lastSavedRef.current = JSON.stringify(initialData);
        isInitialMount.current = true;
    }, [initialData]);

    // Auto-save on debounced changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentJson = JSON.stringify(debouncedForm);
        if (currentJson === lastSavedRef.current) return;

        let cancelled = false;
        const doSave = async (): Promise<void> => {
            setSaveStatus('saving');
            try {
                await profileService.saveProfile(debouncedForm);
                if (!cancelled) {
                    lastSavedRef.current = currentJson;
                    setSaveStatus('saved');
                    setTimeout(() => {
                        if (!cancelled) setSaveStatus('idle');
                    }, 2000);
                }
            } catch (error) {
                if (!cancelled) {
                    setSaveStatus('error');
                    toast.error(getErrorMessage(error));
                }
            }
        };
        doSave();
        return () => { cancelled = true; };
    }, [debouncedForm]);

    const updateField = useCallback(<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]): void => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const saveNow = useCallback(async (): Promise<void> => {
        setSaveStatus('saving');
        try {
            await profileService.saveProfile(form);
            lastSavedRef.current = JSON.stringify(form);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            setSaveStatus('error');
            toast.error(getErrorMessage(error));
        }
    }, [form]);

    return { form, updateField, saveStatus, saveNow };
}
