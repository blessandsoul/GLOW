'use client';

import { useState, useEffect } from 'react';
import { trendService } from '../services/trend.service';
import type { TrendTemplate } from '../types/trend.types';

export function useCurrentTrends() {
    const [trends, setTrends] = useState<TrendTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchTrends = async () => {
            setIsLoading(true);
            try {
                const data = await trendService.getCurrentTrends();
                if (isMounted) setTrends(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchTrends();
        return () => { isMounted = false; };
    }, []);

    return { trends, isLoading };
}

export function useArchiveTrends() {
    const [trends, setTrends] = useState<TrendTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchArchive = async () => {
            setIsLoading(true);
            try {
                const data = await trendService.getArchive();
                if (isMounted) setTrends(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchArchive();
        return () => { isMounted = false; };
    }, []);

    return { trends, isLoading };
}
