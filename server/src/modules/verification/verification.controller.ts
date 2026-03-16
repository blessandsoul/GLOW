import type { FastifyRequest, FastifyReply } from 'fastify';
import { BadRequestError } from '@/shared/errors/errors.js';
import { uploadFile, validateImage, processImage } from '@/libs/storage.js';
import type { StorageFile } from '@/libs/storage.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import {
  RequestVerificationSchema,
  AdminReviewSchema,
  AdminSetBadgeSchema,
  AdminVerificationUserParamSchema,
  PaginationSchema,
  VerificationListQuerySchema,
} from './verification.schemas.js';
import { verificationRepo } from './verification.repo.js';
import type { VerificationService } from './verification.service.js';

const MAX_MULTI_PICS = 10;
const UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function createVerificationController(service: VerificationService) {
  return {
    async getState(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const state = await service.getVerificationState(request.user!.id);
      reply.send(successResponse('Verification state retrieved', state));
    },

    async requestVerification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = RequestVerificationSchema.parse(request.body);
      const state = await service.requestVerification(request.user!.id, input);
      reply.send(successResponse('Verification request submitted', state));
    },

    async uploadIdDocument(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const data = await request.file();
      if (!data) {
        throw new BadRequestError('No file uploaded', 'NO_FILE');
      }

      let file: StorageFile = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      validateImage(file, UPLOAD_MAX_SIZE);
      file = await processImage(file);

      const url = await uploadFile(file, 'verification/id');
      const updated = await verificationRepo.updateIdDocument(request.user!.id, url);
      reply.send(successResponse('ID document uploaded', updated));
    },

    async uploadCertificate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const data = await request.file();
      if (!data) {
        throw new BadRequestError('No file uploaded', 'NO_FILE');
      }

      let file: StorageFile = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      validateImage(file, UPLOAD_MAX_SIZE);
      file = await processImage(file);

      const url = await uploadFile(file, 'verification/certificates');
      const updated = await verificationRepo.updateCertificate(request.user!.id, url);
      reply.send(successResponse('Certificate uploaded', updated));
    },

    async uploadHygienePics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const existing = await verificationRepo.getVerificationState(request.user!.id);
      const existingUrls: string[] = Array.isArray(existing?.hygienePicsUrl)
        ? (existing.hygienePicsUrl as string[])
        : [];

      const newUrls: string[] = [];

      for await (const part of request.files()) {
        if (existingUrls.length + newUrls.length >= MAX_MULTI_PICS) {
          throw new BadRequestError(
            `Maximum ${MAX_MULTI_PICS} hygiene pictures allowed.`,
            'MAX_FILES_EXCEEDED',
          );
        }

        let file: StorageFile = {
          buffer: await part.toBuffer(),
          filename: part.filename,
          mimetype: part.mimetype,
        };

        validateImage(file, UPLOAD_MAX_SIZE);
        file = await processImage(file);

        const url = await uploadFile(file, 'verification/hygiene');
        newUrls.push(url);
      }

      if (newUrls.length === 0) {
        throw new BadRequestError('No files uploaded', 'NO_FILE');
      }

      const updated = await verificationRepo.updateHygienePics(request.user!.id, [
        ...existingUrls,
        ...newUrls,
      ]);
      reply.send(successResponse('Hygiene pictures uploaded', updated));
    },

    async uploadQualityProductsPics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const existing = await verificationRepo.getVerificationState(request.user!.id);
      const existingUrls: string[] = Array.isArray(existing?.qualityProductsUrl)
        ? (existing.qualityProductsUrl as string[])
        : [];

      const newUrls: string[] = [];

      for await (const part of request.files()) {
        if (existingUrls.length + newUrls.length >= MAX_MULTI_PICS) {
          throw new BadRequestError(
            `Maximum ${MAX_MULTI_PICS} quality product pictures allowed.`,
            'MAX_FILES_EXCEEDED',
          );
        }

        let file: StorageFile = {
          buffer: await part.toBuffer(),
          filename: part.filename,
          mimetype: part.mimetype,
        };

        validateImage(file, UPLOAD_MAX_SIZE);
        file = await processImage(file);

        const url = await uploadFile(file, 'verification/quality-products');
        newUrls.push(url);
      }

      if (newUrls.length === 0) {
        throw new BadRequestError('No files uploaded', 'NO_FILE');
      }

      const updated = await verificationRepo.updateQualityProductsPics(request.user!.id, [
        ...existingUrls,
        ...newUrls,
      ]);
      reply.send(successResponse('Quality product pictures uploaded', updated));
    },

    async adminGetPending(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { page, limit } = PaginationSchema.parse(request.query);
      const { items, totalItems } = await service.getPendingVerifications(page, limit);
      reply.send(paginatedResponse('Pending verifications retrieved', items, page, limit, totalItems));
    },

    async adminGetAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { page, limit, status } = VerificationListQuerySchema.parse(request.query);
      const { items, totalItems } = await service.getAllVerifications(page, limit, status);
      reply.send(paginatedResponse('Verifications retrieved', items, page, limit, totalItems));
    },

    async adminReview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { userId } = AdminVerificationUserParamSchema.parse(request.params);
      const input = AdminReviewSchema.parse(request.body);
      const state = await service.adminReview(userId, request.user!.id, input);
      reply.send(successResponse('Verification reviewed', state));
    },

    async adminSetBadge(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { userId } = AdminVerificationUserParamSchema.parse(request.params);
      const input = AdminSetBadgeSchema.parse(request.body);
      const state = await service.adminSetBadge(userId, input);
      reply.send(successResponse('Badge updated', state));
    },
  };
}
