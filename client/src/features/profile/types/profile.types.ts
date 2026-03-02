export interface MasterProfile {
    id: string;
    userId: string;
    city: string | null;
    niche: string | null;
    services: ServiceItem[] | null;
    bio: string | null;
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
    createdAt: string;
    updatedAt: string;
}

export type PriceType = 'fixed' | 'hourly';

export interface ServiceItem {
    name: string;
    price: number;
    priceType: PriceType;
    category: string;
}

export interface ProfileFormData {
    city: string;
    niche: string;
    bio: string;
    phone: string;
    whatsapp: string;
    telegram: string;
    instagram: string;
    services: ServiceItem[];
}

export interface SpecialityOption {
    slug: string;
    label: string;
}

export interface ServiceCategory {
    id: string;
    label: string;
    icon: string;
    suggestions: string[];
}

export const DEFAULT_PROFILE: ProfileFormData = {
    city: '',
    niche: '',
    bio: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    instagram: '',
    services: [],
};
