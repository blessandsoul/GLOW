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
    const [saveCounter, setSaveCounter] = useState(0);
    const debouncedForm = useDebounce(form, 800);
    const lastSavedRef = useRef<string>(JSON.stringify(initialData));
    const isInitialMount = useRef(true);
    const formRef = useRef(form);
    formRef.current = form;

    // Sync when initial data changes (e.g., after fetch)
    useEffect(() => {
        setForm(initialData);
        lastSavedRef.current = JSON.stringify(initialData);
        isInitialMount.current = true;
    }, [initialData]);

    // Save function
    const doSave = useCallback(async (dataToSave: ProfileFormData): Promise<void> => {
        const currentJson = JSON.stringify(dataToSave);
        if (currentJson === lastSavedRef.current) return;

        setSaveStatus('saving');
        try {
            await profileService.saveProfile(dataToSave);
            lastSavedRef.current = currentJson;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            setSaveStatus('error');
            toast.error(getErrorMessage(error));
        }
    }, []);

    // Auto-save on debounced changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        doSave(debouncedForm);
    }, [debouncedForm, doSave]);

    // Immediate save triggered by saveCounter (for select/dropdown changes)
    useEffect(() => {
        if (saveCounter === 0) return;
        doSave(formRef.current);
    }, [saveCounter, doSave]);

    const updateField = useCallback(<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]): void => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };

            // Trigger immediate save for discrete fields (selects, not text typing)
            if (key === 'city' || key === 'niche') {
                // Use a counter bump to trigger the immediate save effect
                setTimeout(() => setSaveCounter((c) => c + 1), 0);
            }

            return next;
        });
    }, []);

    const saveNow = useCallback(async (): Promise<void> => {
        await doSave(formRef.current);
    }, [doSave]);

    return { form, updateField, saveStatus, saveNow };
}
