'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { creditsService } from '../services/credits.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useAppDispatch } from '@/store/hooks';
import { updateCredits } from '@/features/auth/store/authSlice';
import type { CreditBalance, CreditPackage, CreditTransaction } from '../types/credits.types';
import type { PaginationMeta } from '@/lib/api/api.types';

export function useCreditsBalance() {
    const [data, setData] = useState<CreditBalance | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBalance = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await creditsService.getBalance();
            setData(res);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return { data, isLoading, refetch: fetchBalance };
}

export function useCreditPackages() {
    const [data, setData] = useState<CreditPackage[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchPackages = async () => {
            setIsLoading(true);
            try {
                const res = await creditsService.getPackages();
                if (isMounted) setData(res);
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchPackages();
        return () => { isMounted = false; };
    }, []);

    return { data, isLoading };
}

export function usePurchasePackage(onSuccessCallback?: () => void) {
    const [isPending, setIsPending] = useState(false);
    const dispatch = useAppDispatch();

    const mutate = async (packageId: string) => {
        setIsPending(true);
        try {
            const res = await creditsService.purchasePackage(packageId);
            dispatch(updateCredits(res.credits));
            toast.success(`კრედიტები დაემატა! ბალანსი: ${res.credits} კრ.`);
            if (onSuccessCallback) onSuccessCallback();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
}

export function useCreditHistory(page: number = 1, limit: number = 10) {
    const [data, setData] = useState<{ items: CreditTransaction[]; pagination: PaginationMeta } | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await creditsService.getHistory(page, limit);
            setData(res);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { data, isLoading, refetch: fetchHistory };
}
