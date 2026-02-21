import type { PortfolioItem, PortfolioItemFormData, PublicPortfolioData } from '../types/portfolio.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=600&h=800&fit=crop',
];

const mockItems: PortfolioItem[] = SAMPLE_IMAGES.map((url, i) => ({
    id: `portfolio-${i + 1}`,
    userId: 'mock-user-id',
    jobId: `job-${i + 1}`,
    imageUrl: url,
    title: i % 2 === 0 ? 'system.sys_6q2f7f' : 'system.sys_vy9px7',
    niche: 'lashes',
    isPublished: true,
    sortOrder: i,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

class PortfolioService {
    async getMyPortfolio(): Promise<PortfolioItem[]> {
        await delay(400);
        return [...mockItems];
    }

    async addItem(data: PortfolioItemFormData): Promise<PortfolioItem> {
        await delay(500);
        const item: PortfolioItem = {
            id: `portfolio-${Date.now()}`,
            userId: 'mock-user-id',
            jobId: data.jobId ?? null,
            imageUrl: data.imageUrl,
            title: data.title || null,
            niche: data.niche || null,
            isPublished: data.isPublished,
            sortOrder: mockItems.length,
            createdAt: new Date().toISOString(),
        };
        mockItems.push(item);
        return item;
    }

    async updateItem(id: string, data: Partial<PortfolioItemFormData>): Promise<PortfolioItem> {
        await delay(300);
        const idx = mockItems.findIndex((item) => item.id === id);
        if (idx === -1) throw new Error('Item not found');
        const updated = {
            ...mockItems[idx],
            ...(data.title !== undefined && { title: data.title || null }),
            ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        };
        mockItems[idx] = updated;
        return updated;
    }

    async deleteItem(id: string): Promise<void> {
        await delay(300);
        const idx = mockItems.findIndex((item) => item.id === id);
        if (idx !== -1) mockItems.splice(idx, 1);
    }

    async getPublicPortfolio(username: string): Promise<PublicPortfolioData> {
        await delay(500);
        return {
            username,
            displayName: 'Anna Beauty Studio',
            bio: 'system.sys_ojosp0',
            instagram: '@anna_lashes',
            city: 'system.sys_ztyawf',
            niche: 'lashes',
            services: [
                { name: 'system.sys_6q2f7f', price: 80, currency: 'GEL' },
                { name: 'system.sys_of3uqg', price: 100, currency: 'GEL' },
                { name: 'system.sys_ab9vx7', price: 130, currency: 'GEL' },
                { name: 'system.sys_72pxmw', price: 90, currency: 'GEL' },
            ],
            items: mockItems.filter((item) => item.isPublished),
            reviewsCount: 47,
            averageRating: 4.8,
        };
    }
}

export const portfolioService = new PortfolioService();
