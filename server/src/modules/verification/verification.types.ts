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
}
