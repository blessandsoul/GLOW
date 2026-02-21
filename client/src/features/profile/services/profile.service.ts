import type { MasterProfile, ProfileFormData } from '../types/profile.types';

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

let mockProfile: MasterProfile | null = null;

class ProfileService {
    async getProfile(): Promise<MasterProfile | null> {
        await delay(300);
        return mockProfile;
    }

    async saveProfile(data: ProfileFormData): Promise<MasterProfile> {
        await delay(500);
        mockProfile = {
            id: mockProfile?.id ?? `profile-${Date.now()}`,
            userId: 'mock-user-id',
            city: data.city || null,
            niche: data.niche || null,
            services: data.services.length > 0 ? data.services : null,
            bio: data.bio || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            telegram: data.telegram || null,
            instagram: data.instagram || null,
            createdAt: mockProfile?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return mockProfile;
    }
}

export const profileService = new ProfileService();
