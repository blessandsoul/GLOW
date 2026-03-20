import type { MasterTier } from '@/features/masters/types/masters.types';

export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface VerificationState {
    verificationStatus: VerificationStatus;
    idDocumentUrl: string | null;
    rejectionReason: string | null;
    verifiedAt: string | null;
    certificateUrl: string | null;
    hygienePicsUrl: string[] | null;
    qualityProductsUrl: string[] | null;
    experienceYears: number | null;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    isTopRated: boolean;
    masterTier: MasterTier;
}

export interface VerificationRequest {
    userId: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    niche: string | null;
    city: string | null;
    verificationStatus: VerificationStatus;
    idDocumentUrl: string | null;
    portfolioCount: number;
    phoneVerified: boolean;
    createdAt: string;
    certificateUrl: string | null;
    hygienePicsUrl: string[] | null;
    qualityProductsUrl: string[] | null;
    experienceYears: number | null;
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    masterTier: MasterTier;
}

export interface MasterBadges {
    isCertified: boolean;
    isHygieneVerified: boolean;
    isQualityProducts: boolean;
    isTopRated: boolean;
}

export type BadgeType = 'isCertified' | 'isHygieneVerified' | 'isQualityProducts';
