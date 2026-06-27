export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ModelVerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface FacePhoto {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
}

export interface OwnerPhoto extends FacePhoto {
    sortOrder: number;
    moderationStatus: ModerationStatus;
}

export interface ModelDistrict {
    name: string;
    slug: string;
}

export interface ModelCard {
    id: string;
    displayName: string | null;
    city: string | null;
    age: number | null;
    heightCm: number | null;
    blurred: boolean;
    district: ModelDistrict | null;
    photos: FacePhoto[];
    interestedCount: number;
}

export interface ModelContact {
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
}

export interface ModelDetail extends ModelCard {
    bio: string | null;
    measurements: string | null;
    hairColor: string | null;
    eyeColor: string | null;
    niches: string[];
    contactRevealed: boolean;
    contact: ModelContact | null;
}

export interface MyModelProfile {
    id: string;
    displayName: string | null;
    birthDate: string | null;
    age: number | null;
    city: string | null;
    bio: string | null;
    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
    verificationStatus: ModelVerificationStatus;
    rejectionReason: string | null;
    isActive: boolean;
    blurredAt: string | null;
    withdrawnAt: string | null;
    photos: OwnerPhoto[];
    interestedCount: number;
}

export interface FacesCatalogFilters {
    page?: number;
    limit?: number;
    city?: string;
    district?: string;
    niche?: string;
    search?: string;
}

export interface PendingModelPhoto {
    id: string;
    imageUrl: string;
    moderationStatus: ModerationStatus;
}

export interface PendingModel {
    id: string;
    userId: string;
    displayName: string | null;
    city: string | null;
    birthDate: string | null;
    consentAt: string | null;
    photos: PendingModelPhoto[];
}

export interface ModelOnboardingPayload {
    role: 'MODEL';
    displayName: string;
    city: string;
    birthDate: string;
    niches?: string[];
    bio?: string;
    phone?: string;
    instagram?: string;
    consent: true;
}
