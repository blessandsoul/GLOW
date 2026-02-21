'use client';

import { useState, useEffect } from 'react';
import { portfolioService } from '@/features/portfolio/services/portfolio.service';
import type { PortfolioItem } from '@/features/portfolio/types/portfolio.types';

export function usePortfolioPreview(): {
    items: PortfolioItem[];
    isLoading: boolean;
    publishedCount: number;
} {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = async (): Promise<void> => {
            try {
                const data = await portfolioService.getMyPortfolio();
                if (isMounted) setItems(data ?? []);
            } catch {
                // silently ignore preview errors
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        void load();
        return () => { isMounted = false; };
    }, []);

    const publishedCount = items.filter((i) => i.isPublished).length;

    return { items, isLoading, publishedCount };
}
