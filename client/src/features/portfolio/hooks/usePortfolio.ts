'use client';
import { useLanguage } from "@/i18n/hooks/useLanguage";


import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { portfolioService } from '../services/portfolio.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { PortfolioItem, PortfolioItemFormData, PublicPortfolioData } from '../types/portfolio.types';

export function useMyPortfolio() {
    const { t } = useLanguage();
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchPortfolio = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await portfolioService.getMyPortfolio();
            setItems(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    const addItem = async (formData: PortfolioItemFormData) => {
        setIsAdding(true);
        try {
            await portfolioService.addItem(formData);
            await fetchPortfolio();
            toast.success(t('system.sys_ykzsc6'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsAdding(false);
        }
    };

    const updateItem = async ({ id, data: formData }: { id: string; data: Partial<PortfolioItemFormData> }) => {
        try {
            await portfolioService.updateItem(id, formData);
            await fetchPortfolio();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const deleteItem = async (id: string) => {
        setIsDeleting(true);
        try {
            await portfolioService.deleteItem(id);
            await fetchPortfolio();
            toast.success(t('system.sys_n9htfx'));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsDeleting(false);
        }
    };

    return { items, isLoading, addItem, isAdding, updateItem, deleteItem, isDeleting };
}

export function usePublicPortfolio(username: string) {
    const [portfolio, setPortfolio] = useState<PublicPortfolioData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!username) return;
        let isMounted = true;
        const fetchPublic = async () => {
            setIsLoading(true);
            setIsError(false);
            try {
                const data = await portfolioService.getPublicPortfolio(username);
                if (isMounted) setPortfolio(data);
            } catch (error) {
                if (isMounted) setIsError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchPublic();
        return () => { isMounted = false; };
    }, [username]);

    return { portfolio, isLoading, isError };
}
