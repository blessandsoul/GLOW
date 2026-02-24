import type { FastifyRequest, FastifyReply } from 'fastify';
import { PurchasePackageSchema, HistoryQuerySchema } from './credits.schemas.js';
import { creditsService } from './credits.service.js';
import { successResponse } from '../../shared/responses/successResponse.js';
import { paginatedResponse } from '../../shared/responses/paginatedResponse.js';
import type { JwtPayload } from '../../shared/types/index.js';

export const creditsController = {
  async getBalance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const balance = await creditsService.getBalance(user.id);
    await reply.send(successResponse('Balance retrieved', balance));
  },

  async getPackages(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const packages = await creditsService.getPackages();
    await reply.send(successResponse('Packages retrieved', packages));
  },

  async purchase(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const { packageId } = PurchasePackageSchema.parse(request.body);
    const updatedBalance = await creditsService.purchasePackage(user.id, packageId);
    await reply.send(successResponse('Package purchased successfully', { credits: updatedBalance }));
  },

  async getHistory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const { page, limit, type } = HistoryQuerySchema.parse(request.query);
    const { items, totalItems } = await creditsService.getHistory(user.id, page, limit, type);
    await reply.send(paginatedResponse('Transaction history retrieved', items, page, limit, totalItems));
  },
};
