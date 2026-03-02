'use client';

import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalog.service';
import type { ServiceCategory, SpecialityOption } from '../types/profile.types';

// Module-level cache — shared across all component instances, fetched once per app lifecycle
let cachedSpecialities: SpecialityOption[] | null = null;
let cachedCategories: ServiceCategory[] | null = null;

export function useSpecialities(): { specialities: SpecialityOption[]; isLoading: boolean } {
    const [data, setData] = useState<SpecialityOption[]>(cachedSpecialities ?? []);
    const [isLoading, setIsLoading] = useState(!cachedSpecialities);

    useEffect(() => {
        if (cachedSpecialities) return;
        let mounted = true;
        catalogService.getSpecialities()
            .then((res) => {
                cachedSpecialities = res;
                if (mounted) setData(res);
            })
            .catch(() => { /* silent — selects will just be empty */ })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    return { specialities: data, isLoading };
}

export function useServiceCategories(): { categories: ServiceCategory[]; isLoading: boolean } {
    const [data, setData] = useState<ServiceCategory[]>(cachedCategories ?? []);
    const [isLoading, setIsLoading] = useState(!cachedCategories);

    useEffect(() => {
        if (cachedCategories) return;
        let mounted = true;
        catalogService.getServiceCategories()
            .then((res) => {
                cachedCategories = res;
                if (mounted) setData(res);
            })
            .catch(() => { /* silent — UI will show empty categories */ })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    return { categories: data, isLoading };
}
