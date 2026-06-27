'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingService } from '../services/booking.service';
import { bookingKeys } from './useBooking';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { BookingSettings, BookingSettingsPayload } from '../types/booking.types';

export function useBookingSettings(): {
    settings: BookingSettings | undefined;
    isLoading: boolean;
    save: (payload: BookingSettingsPayload) => Promise<void>;
    isSaving: boolean;
} {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const { data, isLoading } = useQuery({
        queryKey: bookingKeys.settings(),
        queryFn: () => bookingService.getSettings(),
        staleTime: 60 * 1000,
        retry: 1,
    });

    const mutation = useMutation({
        mutationFn: (payload: BookingSettingsPayload) => bookingService.saveSettings(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: bookingKeys.settings() });
            toast.success(t('booking.settings_saved'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    return {
        settings: data,
        isLoading,
        save: mutation.mutateAsync,
        isSaving: mutation.isPending,
    };
}
