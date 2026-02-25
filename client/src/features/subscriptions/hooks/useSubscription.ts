'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { subscriptionService } from '../services/subscription.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { Subscription, SubscribeRequest } from '../types/subscription.types';

export function useCurrentSubscription() {
    const [data, setData] = useState<Subscription | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await subscriptionService.getCurrent();
            setData(res);
        } catch {
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, isLoading, refetch: fetch };
}

export function useSubscribe(onSuccess?: () => void) {
    const [isPending, setIsPending] = useState(false);

    const mutate = useCallback(
        async (input: SubscribeRequest) => {
            setIsPending(true);
            try {
                await subscriptionService.subscribe(input);
                toast.success('გამოწერა გააქტიურდა!');
                if (onSuccess) onSuccess();
            } catch (err) {
                toast.error(getErrorMessage(err));
            } finally {
                setIsPending(false);
            }
        },
        [onSuccess],
    );

    return { mutate, isPending };
}

export function useCancelSubscription(onSuccess?: () => void) {
    const [isPending, setIsPending] = useState(false);

    const mutate = useCallback(async () => {
        setIsPending(true);
        try {
            await subscriptionService.cancel();
            toast.success('გამოწერა გაუქმდა. აქტიურია პერიოდის ბოლომდე.');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsPending(false);
        }
    }, [onSuccess]);

    return { mutate, isPending };
}

export function useReactivateSubscription(onSuccess?: () => void) {
    const [isPending, setIsPending] = useState(false);

    const mutate = useCallback(async () => {
        setIsPending(true);
        try {
            await subscriptionService.reactivate();
            toast.success('ავტომატური განახლება ჩართულია!');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsPending(false);
        }
    }, [onSuccess]);

    return { mutate, isPending };
}
