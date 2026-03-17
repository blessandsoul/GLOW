import { useQuery } from '@tanstack/react-query';
import { mastersService } from '../services/masters.service';
import type { CatalogDistrict, CatalogBrand, CatalogStyleTag } from '../types/masters.types';

export function useDistricts(citySlug?: string): { districts: CatalogDistrict[]; isLoading: boolean } {
    const { data, isLoading } = useQuery({
        queryKey: ['catalog', 'districts', citySlug],
        queryFn: () => mastersService.getDistricts(citySlug),
    });
    return { districts: data ?? [], isLoading };
}

export function useBrands(): { brands: CatalogBrand[]; isLoading: boolean } {
    const { data, isLoading } = useQuery({
        queryKey: ['catalog', 'brands'],
        queryFn: () => mastersService.getBrands(),
    });
    return { brands: data ?? [], isLoading };
}

export function useStyleTags(niche?: string): { styleTags: CatalogStyleTag[]; isLoading: boolean } {
    const { data, isLoading } = useQuery({
        queryKey: ['catalog', 'style-tags', niche],
        queryFn: () => mastersService.getStyleTags(niche),
    });
    return { styleTags: data ?? [], isLoading };
}
