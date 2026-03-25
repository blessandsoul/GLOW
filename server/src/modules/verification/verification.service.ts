import { logger } from '@/libs/logger.js';
import { BadRequestError, NotFoundError } from '@/shared/errors/errors.js';
import { verificationRepo } from './verification.repo.js';
import type { RequestVerificationInput, AdminReviewInput, AdminSetBadgeInput, AdminSetTierInput } from './verification.schemas.js';
import { prisma } from '@/libs/prisma.js';
import { sendSms } from '@/libs/otp.js';

const MIN_PORTFOLIO_ITEMS = 5;

const SMS_MESSAGES = {
  GLOW_STAR_ACCEPTED: 'Glow.GE: თქვენი Glow Star განაცხადი მიღებულია განსახილველად. ჩვენი წარმომადგენელი მალე დაგიკავშირდებათ.',
  GLOW_STAR_APPROVED: 'Glow.GE: გილოცავთ! თქვენ მიიღეთ Glow Star სტატუსი!',
  GLOW_STAR_REJECTED: 'Glow.GE: სამწუხაროდ, თქვენი Glow Star განაცხადი ამჯერად არ დამტკიცდა.',
  VERIFICATION_APPROVED: 'Glow.GE: თქვენი პროფილი წარმატებით ვერიფიცირებულია!',
  VERIFICATION_REJECTED: 'Glow.GE: სამწუხაროდ, თქვენი ვერიფიკაცია ამჯერად არ დამტკიცდა.',
} as const;

async function notifyUserBySms(userId: string, message: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phoneVerified: true },
  });
  if (user?.phone && user.phoneVerified) {
    sendSms(user.phone, message).catch(() => {});
  }
}

const TIER_SORT_MAP: Record<string, number> = {
  TOP_MASTER: 0,
  PROFESSIONAL: 1,
  INTERMEDIATE: 2,
  JUNIOR: 3,
};

export function createVerificationService() {
  return {
    async getVerificationState(userId: string) {
      const state = await verificationRepo.getVerificationState(userId);
      if (!state) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }
      return state;
    },

    async requestVerification(userId: string, input: RequestVerificationInput) {
      const profile = await prisma.masterProfile.findUnique({
        where: { userId },
        select: {
          verificationStatus: true,
          idDocumentUrl: true,
          city: true,
          niche: true,
          instagram: true,
          user: {
            select: { phoneVerified: true },
          },
        },
      });

      if (!profile) {
        throw new NotFoundError('Master profile not found. Please complete your profile first.', 'PROFILE_NOT_FOUND');
      }

      if (profile.verificationStatus === 'PENDING') {
        throw new BadRequestError('Verification is already pending review.', 'VERIFICATION_ALREADY_PENDING');
      }

      if (profile.verificationStatus === 'VERIFIED') {
        throw new BadRequestError('Your profile is already verified.', 'ALREADY_VERIFIED');
      }

      if (!profile.user.phoneVerified) {
        throw new BadRequestError('Phone verification is required before requesting verification.', 'PHONE_NOT_VERIFIED');
      }

      if (!profile.idDocumentUrl) {
        throw new BadRequestError('ID document upload is required before requesting verification.', 'ID_DOCUMENT_REQUIRED');
      }

      if (!profile.city || !profile.niche) {
        throw new BadRequestError('City and niche must be filled in your profile before requesting verification.', 'PROFILE_INCOMPLETE');
      }

      if (!profile.instagram) {
        throw new BadRequestError('Instagram link is required before requesting verification.', 'INSTAGRAM_REQUIRED');
      }

      const publishedPortfolioCount = await prisma.portfolioItem.count({
        where: { userId, isPublished: true },
      });

      if (publishedPortfolioCount < MIN_PORTFOLIO_ITEMS) {
        throw new BadRequestError(
          `At least ${MIN_PORTFOLIO_ITEMS} published portfolio items are required. You currently have ${publishedPortfolioCount}.`,
          'INSUFFICIENT_PORTFOLIO',
        );
      }

      logger.info({ userId }, 'Master requesting verification');

      return verificationRepo.submitVerification(userId, {
        experienceYears: input.experienceYears,
      });
    },

    async adminReview(userId: string, adminId: string, input: AdminReviewInput) {
      const profile = await verificationRepo.getVerificationState(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (input.action === 'approve') {
        logger.info({ userId, adminId }, 'Admin approving verification');
        const result = await verificationRepo.approveVerification(userId, adminId);
        notifyUserBySms(userId, SMS_MESSAGES.VERIFICATION_APPROVED);
        return result;
      }

      if (!input.reason) {
        throw new BadRequestError('A rejection reason is required when rejecting a verification request.', 'REASON_REQUIRED');
      }

      logger.info({ userId, adminId, reason: input.reason }, 'Admin rejecting verification');
      const result = await verificationRepo.rejectVerification(userId, input.reason);
      notifyUserBySms(userId, SMS_MESSAGES.VERIFICATION_REJECTED);
      return result;
    },

    async adminSetBadge(userId: string, input: AdminSetBadgeInput) {
      const profile = await verificationRepo.getVerificationState(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      logger.info({ userId, badge: input.badge, granted: input.granted }, 'Admin setting badge');
      return verificationRepo.setBadge(userId, input.badge, input.granted);
    },

    async adminSetTier(userId: string, input: AdminSetTierInput) {
      const profile = await verificationRepo.getVerificationState(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (input.tier !== 'JUNIOR' && profile.verificationStatus !== 'VERIFIED') {
        throw new BadRequestError('Master must be verified for tiers above Junior', 'NOT_VERIFIED');
      }

      if (input.tier === 'TOP_MASTER') {
        if (!profile.isCertified || !profile.isHygieneVerified) {
          throw new BadRequestError('Top Master requires certified + hygiene badges', 'MISSING_BADGES');
        }
      }

      logger.info({ userId, tier: input.tier }, 'Admin setting master tier');
      return verificationRepo.setTier(userId, input.tier, TIER_SORT_MAP[input.tier]);
    },

    async getGlowStarState(userId: string) {
      const state = await verificationRepo.getGlowStarState(userId);
      if (!state) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }
      return state;
    },

    async requestGlowStar(userId: string) {
      const profile = await prisma.masterProfile.findUnique({
        where: { userId },
        select: {
          glowStarStatus: true,
          masterTier: true,
          instagram: true,
          city: true,
          niche: true,
          services: true,
        },
      });

      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (profile.glowStarStatus === 'REQUESTED' || profile.glowStarStatus === 'UNDER_REVIEW') {
        throw new BadRequestError('Glow Star request is already pending.', 'GLOW_STAR_ALREADY_REQUESTED');
      }

      if (profile.masterTier === 'TOP_MASTER') {
        throw new BadRequestError('You already have Top Master status.', 'ALREADY_TOP_MASTER');
      }

      if (!profile.instagram) {
        throw new BadRequestError('Instagram is required for Glow Star request.', 'INSTAGRAM_REQUIRED');
      }

      if (!profile.city || !profile.niche) {
        throw new BadRequestError('Complete your profile before requesting Glow Star.', 'PROFILE_INCOMPLETE');
      }

      const portfolioCount = await prisma.portfolioItem.count({
        where: { userId, isPublished: true },
      });

      if (portfolioCount < 10) {
        throw new BadRequestError(
          `At least 10 published portfolio items are required. You have ${portfolioCount}.`,
          'INSUFFICIENT_PORTFOLIO',
        );
      }

      logger.info({ userId }, 'Master requesting Glow Star status');
      return verificationRepo.requestGlowStar(userId);
    },

    async adminReviewGlowStar(userId: string, action: 'accept' | 'approve' | 'reject') {
      const profile = await verificationRepo.getGlowStarState(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (action === 'accept') {
        if (profile.glowStarStatus !== 'REQUESTED') {
          throw new BadRequestError('Can only accept a REQUESTED Glow Star application.', 'INVALID_STATUS');
        }
        logger.info({ userId, action }, 'Admin accepting Glow Star request for review');
        const result = await verificationRepo.acceptGlowStar(userId);
        notifyUserBySms(userId, SMS_MESSAGES.GLOW_STAR_ACCEPTED);
        return result;
      }

      if (action === 'approve') {
        if (profile.glowStarStatus !== 'UNDER_REVIEW') {
          throw new BadRequestError('Can only approve a Glow Star application that is under review.', 'INVALID_STATUS');
        }
        logger.info({ userId, action }, 'Admin approving Glow Star request');
        const result = await verificationRepo.reviewGlowStar(userId, 'approve');
        notifyUserBySms(userId, SMS_MESSAGES.GLOW_STAR_APPROVED);
        return result;
      }

      // reject — allowed from REQUESTED or UNDER_REVIEW
      if (profile.glowStarStatus !== 'REQUESTED' && profile.glowStarStatus !== 'UNDER_REVIEW') {
        throw new BadRequestError('No pending Glow Star request to reject.', 'NO_PENDING_REQUEST');
      }

      logger.info({ userId, action }, 'Admin rejecting Glow Star request');
      const result = await verificationRepo.reviewGlowStar(userId, 'reject');
      notifyUserBySms(userId, SMS_MESSAGES.GLOW_STAR_REJECTED);
      return result;
    },

    async getGlowStarRequests(page: number, limit: number) {
      return verificationRepo.findGlowStarRequests(page, limit);
    },

    async getPendingVerifications(page: number, limit: number) {
      return verificationRepo.findPendingVerifications(page, limit);
    },

    async getAllVerifications(page: number, limit: number, status?: string) {
      return verificationRepo.findAllVerificationRequests(page, limit, status);
    },
  };
}

export type VerificationService = ReturnType<typeof createVerificationService>;
