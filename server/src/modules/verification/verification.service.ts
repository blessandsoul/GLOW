import { logger } from '@/libs/logger.js';
import { BadRequestError, NotFoundError } from '@/shared/errors/errors.js';
import { verificationRepo } from './verification.repo.js';
import type { RequestVerificationInput, AdminReviewInput, AdminSetBadgeInput } from './verification.schemas.js';
import { prisma } from '@/libs/prisma.js';

const MIN_PORTFOLIO_ITEMS = 5;

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

      if (profile.verificationStatus !== 'PENDING') {
        throw new BadRequestError('Only pending verification requests can be reviewed.', 'NOT_PENDING');
      }

      if (input.action === 'approve') {
        logger.info({ userId, adminId }, 'Admin approving verification');
        return verificationRepo.approveVerification(userId, adminId);
      }

      if (!input.reason) {
        throw new BadRequestError('A rejection reason is required when rejecting a verification request.', 'REASON_REQUIRED');
      }

      logger.info({ userId, adminId, reason: input.reason }, 'Admin rejecting verification');
      return verificationRepo.rejectVerification(userId, input.reason);
    },

    async adminSetBadge(userId: string, input: AdminSetBadgeInput) {
      const profile = await verificationRepo.getVerificationState(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      logger.info({ userId, badge: input.badge, granted: input.granted }, 'Admin setting badge');
      return verificationRepo.setBadge(userId, input.badge, input.granted);
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
