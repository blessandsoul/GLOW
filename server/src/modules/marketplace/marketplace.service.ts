import { logger } from '@/libs/logger.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/errors.js';
import { prisma } from '@/libs/prisma.js';
import { sendSms } from '@/libs/otp.js';
import { marketplaceRepo } from './marketplace.repo.js';
import type { SellerApplyInput, AdminReviewSellerInput, CreateProductInput, UpdateProductInput, ProductsQueryInput } from './marketplace.schemas.js';

const SMS_MESSAGES = {
  SELLER_APPROVED: 'Glow.GE: თქვენი განაცხადი დამტკიცდა! ახლა შეგიძლიათ გაყიდოთ თქვენი პროდუქცია.',
  SELLER_REJECTED: (reason: string) =>
    `Glow.GE: სამწუხაროდ, თქვენი განაცხადი არ დამტკიცდა. მიზეზი: ${reason}`,
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

export function createMarketplaceService() {
  return {
    // ── Seller Application ──

    async getSellerStatus(userId: string) {
      const profile = await marketplaceRepo.getSellerStatus(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }
      return profile;
    },

    async applySeller(userId: string, input: SellerApplyInput) {
      const profile = await prisma.masterProfile.findUnique({
        where: { userId },
        select: { verificationStatus: true, sellerStatus: true },
      });

      if (!profile) {
        throw new NotFoundError('Master profile not found. Complete your profile first.', 'PROFILE_NOT_FOUND');
      }

      if (profile.verificationStatus !== 'VERIFIED') {
        throw new ForbiddenError(
          'You must be a verified master to apply as a seller.',
          'NOT_VERIFIED',
        );
      }

      if (profile.sellerStatus === 'PENDING') {
        throw new ConflictError('Your seller application is already pending review.', 'ALREADY_PENDING');
      }

      if (profile.sellerStatus === 'APPROVED') {
        throw new ConflictError('You are already an approved seller.', 'ALREADY_APPROVED');
      }

      logger.info({ userId }, 'Master applying for seller status');
      return marketplaceRepo.submitSellerApplication(userId, input.reason);
    },

    // ── Admin ──

    async adminGetSellers(page: number, limit: number, status?: string) {
      return marketplaceRepo.findSellerApplications(page, limit, status);
    },

    async adminReviewSeller(userId: string, adminId: string, input: AdminReviewSellerInput) {
      const profile = await marketplaceRepo.getSellerStatus(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (input.action === 'approve') {
        logger.info({ userId, adminId }, 'Admin approving seller application');
        const result = await marketplaceRepo.approveSellerApplication(userId, adminId);
        notifyUserBySms(userId, SMS_MESSAGES.SELLER_APPROVED);
        return result;
      }

      if (!input.reason) {
        throw new BadRequestError('A rejection reason is required.', 'REASON_REQUIRED');
      }

      logger.info({ userId, adminId, reason: input.reason }, 'Admin rejecting seller application');
      const result = await marketplaceRepo.rejectSellerApplication(userId, input.reason);
      notifyUserBySms(userId, SMS_MESSAGES.SELLER_REJECTED(input.reason));
      return result;
    },

    // ── Products ──

    async getMyProducts(userId: string) {
      return marketplaceRepo.findMyProducts(userId);
    },

    async createProduct(userId: string, input: CreateProductInput) {
      const profile = await marketplaceRepo.getSellerStatus(userId);
      if (!profile) {
        throw new NotFoundError('Master profile not found', 'PROFILE_NOT_FOUND');
      }

      if (profile.sellerStatus !== 'APPROVED') {
        throw new ForbiddenError(
          'You must be an approved seller to list products.',
          'SELLER_NOT_APPROVED',
        );
      }

      logger.info({ userId, category: input.category }, 'Creating product');
      return marketplaceRepo.createProduct(userId, input);
    },

    async updateProduct(userId: string, productId: string, input: UpdateProductInput) {
      const product = await marketplaceRepo.findProductById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
      }
      if (product.userId !== userId) {
        throw new ForbiddenError('You do not own this product', 'NOT_OWNER');
      }

      return marketplaceRepo.updateProduct(productId, input);
    },

    async deleteProduct(userId: string, productId: string) {
      const product = await marketplaceRepo.findProductById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
      }
      if (product.userId !== userId) {
        throw new ForbiddenError('You do not own this product', 'NOT_OWNER');
      }

      await marketplaceRepo.deleteProduct(productId);
    },

    async uploadProductImage(userId: string, productId: string, imageUrl: string) {
      const product = await marketplaceRepo.findProductById(productId);
      if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
      }
      if (product.userId !== userId) {
        throw new ForbiddenError('You do not own this product', 'NOT_OWNER');
      }

      const currentUrls = Array.isArray(product.imageUrls) ? (product.imageUrls as string[]) : [];
      if (currentUrls.length >= 5) {
        throw new BadRequestError('Maximum 5 images per product.', 'MAX_IMAGES_EXCEEDED');
      }

      return marketplaceRepo.addImageUrls(productId, currentUrls, [imageUrl]);
    },

    // ── Browse ──

    async getProducts(filters: ProductsQueryInput) {
      return marketplaceRepo.findProducts(filters);
    },

    async getProduct(id: string) {
      const product = await marketplaceRepo.findProductById(id);
      if (!product) {
        throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
      }
      return product;
    },

    async getSellerProducts(username: string) {
      return marketplaceRepo.findProductsByUsername(username);
    },
  };
}

export type MarketplaceService = ReturnType<typeof createMarketplaceService>;
