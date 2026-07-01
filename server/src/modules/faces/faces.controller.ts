import type { FastifyRequest, FastifyReply } from 'fastify';
import { BadRequestError } from '@/shared/errors/errors.js';
import { uploadFile, validateImage, processImage } from '@/libs/storage.js';
import type { StorageFile } from '@/libs/storage.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import { facesService } from './faces.service.js';
import {
  ModelIdParamSchema,
  PhotoIdParamSchema,
  UserIdParamSchema,
  CatalogQuerySchema,
  UpdateModelProfileSchema,
  AdminReviewSchema,
  PhotoReviewSchema,
  InterestStatusQuerySchema,
  AdminPendingQuerySchema,
} from './faces.schemas.js';

const UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const facesController = {
  // ── Catalog (master-facing) ──
  async getCatalog(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const filters = CatalogQuerySchema.parse(request.query);
    const { items, totalItems } = await facesService.getCatalog(filters);
    reply.send(paginatedResponse('Models retrieved', items, filters.page, filters.limit, totalItems));
  },

  async getDetail(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = ModelIdParamSchema.parse(request.params);
    const model = await facesService.getModelDetail(request.user!.id, request.user!.role, id);
    reply.send(successResponse('Model retrieved', model));
  },

  async addInterest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = ModelIdParamSchema.parse(request.params);
    const result = await facesService.addInterest(request.user!.id, id);
    reply.status(201).send(successResponse('Interest expressed', result));
  },

  async removeInterest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = ModelIdParamSchema.parse(request.params);
    await facesService.removeInterest(request.user!.id, id);
    reply.send(successResponse('Interest removed', null));
  },

  async getInterestStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Schema validates + caps + UUID-checks; it yields a ready string[] of model ids.
    const { modelIds } = InterestStatusQuerySchema.parse(request.query);
    const status = await facesService.getInterestStatus(request.user!.id, modelIds);
    reply.send(successResponse('Interest status retrieved', status));
  },

  // ── Owner (model self-service) ──
  async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const profile = await facesService.getMe(request.user!.id);
    reply.send(successResponse('Model profile retrieved', profile));
  },

  async updateMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = UpdateModelProfileSchema.parse(request.body);
    const profile = await facesService.updateProfile(request.user!.id, input);
    reply.send(successResponse('Model profile updated', profile));
  },

  async uploadPhoto(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
    const imageUrl = await uploadFile(file, 'faces');
    const photo = await facesService.uploadPhoto(request.user!.id, imageUrl);
    reply.status(201).send(successResponse('Photo uploaded', photo));
  },

  async deletePhoto(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { photoId } = PhotoIdParamSchema.parse(request.params);
    await facesService.deletePhoto(request.user!.id, photoId);
    reply.send(successResponse('Photo deleted', null));
  },

  async setPrimaryPhoto(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { photoId } = PhotoIdParamSchema.parse(request.params);
    await facesService.setPrimaryPhoto(request.user!.id, photoId);
    reply.send(successResponse('Primary photo updated', null));
  },

  async requestReview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await facesService.requestReview(request.user!.id);
    reply.send(successResponse('Profile submitted for review', result));
  },

  async blur(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await facesService.setBlur(request.user!.id, true);
    reply.send(successResponse('Profile blurred', result));
  },

  async unblur(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await facesService.setBlur(request.user!.id, false);
    reply.send(successResponse('Profile unblurred', result));
  },

  async withdraw(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await facesService.withdraw(request.user!.id);
    reply.send(successResponse('Profile withdrawn', result));
  },

  // ── Admin moderation ──
  async adminGetPending(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit } = AdminPendingQuerySchema.parse(request.query);
    const { items, totalItems } = await facesService.adminGetPending(page, limit);
    reply.send(paginatedResponse('Pending models retrieved', items, page, limit, totalItems));
  },

  async adminReview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamSchema.parse(request.params);
    const input = AdminReviewSchema.parse(request.body);
    const result = await facesService.adminReview(userId, request.user!.id, input.action, input.reason);
    const message = input.action === 'approve' ? 'Model approved' : 'Model rejected';
    reply.send(successResponse(message, result));
  },

  async adminPhotoReview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { photoId } = PhotoIdParamSchema.parse(request.params);
    const { status } = PhotoReviewSchema.parse(request.body);
    const result = await facesService.adminPhotoReview(photoId, status);
    reply.send(successResponse('Photo moderation updated', result));
  },
};
