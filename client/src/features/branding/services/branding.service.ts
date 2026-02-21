import type { BrandingProfile, BrandingFormData } from '../types/branding.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

let mockProfile: BrandingProfile | null = null;

class BrandingService {
    async getProfile(): Promise<BrandingProfile | null> {
        await delay(300);
        return mockProfile;
    }

    async saveProfile(data: BrandingFormData): Promise<BrandingProfile> {
        await delay(600);
        const logoUrl = data.logo ? URL.createObjectURL(data.logo) : mockProfile?.logoUrl ?? null;
        mockProfile = {
            id: mockProfile?.id ?? `branding-${Date.now()}`,
            userId: 'mock-user-id',
            displayName: data.displayName || null,
            instagramHandle: data.instagramHandle || null,
            logoUrl,
            primaryColor: data.primaryColor,
            watermarkStyle: data.watermarkStyle,
            isActive: true,
            createdAt: mockProfile?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return mockProfile;
    }

    async deleteProfile(): Promise<void> {
        await delay(300);
        mockProfile = null;
    }
}

export const brandingService = new BrandingService();
