import type { TrendTemplate } from '../types/trend.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const thisWeek = new Date();
thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay() + 1);

const lastWeek = new Date(thisWeek);
lastWeek.setDate(lastWeek.getDate() - 7);

const MOCK_TRENDS: TrendTemplate[] = [
    {
        id: 'trend-1',
        title: 'Soft Glam',
        description: 'system.sys_hvs3qt',
        previewUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop',
        settings: { warmth: 0.3, blur: 0.15, saturation: 1.1 },
        weekOf: thisWeek.toISOString(),
        isFree: true,
        isActive: true,
        sortOrder: 0,
        createdAt: thisWeek.toISOString(),
    },
    {
        id: 'trend-2',
        title: 'Clean Beauty',
        description: 'system.sys_p7j631',
        previewUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=500&fit=crop',
        settings: { contrast: 1.2, highlights: 0.8, clarity: 0.5 },
        weekOf: thisWeek.toISOString(),
        isFree: false,
        isActive: true,
        sortOrder: 1,
        createdAt: thisWeek.toISOString(),
    },
    {
        id: 'trend-3',
        title: 'Golden Hour',
        description: 'system.sys_o0mkqa',
        previewUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop',
        settings: { warmth: 0.6, exposure: 0.2, golden: true },
        weekOf: thisWeek.toISOString(),
        isFree: false,
        isActive: true,
        sortOrder: 2,
        createdAt: thisWeek.toISOString(),
    },
    {
        id: 'trend-4',
        title: 'Dark Moody',
        description: 'system.sys_e16dxe',
        previewUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=500&fit=crop',
        settings: { shadows: -0.3, contrast: 1.4, vignette: 0.5 },
        weekOf: thisWeek.toISOString(),
        isFree: false,
        isActive: true,
        sortOrder: 3,
        createdAt: thisWeek.toISOString(),
    },
];

const MOCK_ARCHIVE: TrendTemplate[] = [
    {
        id: 'trend-old-1',
        title: 'Pastel Dream',
        description: 'system.sys_4u50q8',
        previewUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop',
        settings: { pastel: true, pink: 0.1 },
        weekOf: lastWeek.toISOString(),
        isFree: true,
        isActive: false,
        sortOrder: 0,
        createdAt: lastWeek.toISOString(),
    },
    {
        id: 'trend-old-2',
        title: 'Vintage Film',
        description: 'system.sys_p6wrug',
        previewUrl: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=400&h=500&fit=crop',
        settings: { grain: 0.3, vintage: true },
        weekOf: lastWeek.toISOString(),
        isFree: false,
        isActive: false,
        sortOrder: 1,
        createdAt: lastWeek.toISOString(),
    },
];

class TrendService {
    async getCurrentTrends(): Promise<TrendTemplate[]> {
        await delay(400);
        return MOCK_TRENDS.filter((t) => t.isActive);
    }

    async getArchive(): Promise<TrendTemplate[]> {
        await delay(400);
        return MOCK_ARCHIVE;
    }
}

export const trendService = new TrendService();
