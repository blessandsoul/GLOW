export type WatermarkStyle = 'MINIMAL' | 'FRAMED' | 'STORIES_TEMPLATE' | 'DIAGONAL' | 'BADGE' | 'SPLIT';

export interface BrandingProfile {
    id: string;
    userId: string;
    displayName: string | null;
    instagramHandle: string | null;
    logoUrl: string | null;
    primaryColor: string;
    watermarkStyle: WatermarkStyle;
    watermarkOpacity: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BrandingFormData {
    displayName: string;
    instagramHandle: string;
    primaryColor: string;
    watermarkStyle: WatermarkStyle;
    watermarkOpacity: number;
    logo?: File;
}



export const DEFAULT_BRANDING: BrandingFormData = {
    displayName: '',
    instagramHandle: '',
    primaryColor: '#d4738a',
    watermarkStyle: 'MINIMAL',
    watermarkOpacity: 1,
};
