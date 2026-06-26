import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import {
  UsernameParamSchema,
  EntryIdParamSchema,
  RequestOtpSchema,
  JoinSchema,
  MasterListQuerySchema,
  UpdateStatusSchema,
} from './waitlist.schemas.js';
import type { WaitlistService } from './waitlist.service.js';

export function createWaitlistController(service: WaitlistService) {
  return {
    // ── Public (share link) ──

    async getPublicServices(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const data = await service.getPublicMasterServices(username);
      reply.send(successResponse('Master services retrieved', data));
    },

    async requestJoinOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const input = RequestOtpSchema.parse(request.body);
      const result = await service.requestJoinOtp(username, input);
      reply.send(successResponse('Verification code sent', result));
    },

    async verifyAndJoin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const input = JoinSchema.parse(request.body);
      const entry = await service.verifyAndJoin(username, input);
      reply.status(201).send(successResponse('Added to the waitlist', entry));
    },

    // ── Master-facing ──

    async listMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const query = MasterListQuerySchema.parse(request.query);
      const { items, totalItems } = await service.listForMaster(request.user!.id, query);
      reply.send(paginatedResponse('Waitlist retrieved', items, query.page, query.limit, totalItems));
    },

    async summaryMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const summary = await service.summaryForMaster(request.user!.id);
      reply.send(successResponse('Waitlist summary retrieved', summary));
    },

    async updateStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = EntryIdParamSchema.parse(request.params);
      const { status } = UpdateStatusSchema.parse(request.body);
      const entry = await service.updateEntryStatus(request.user!.id, id, status);
      reply.send(successResponse('Waitlist entry updated', entry));
    },
  };
}
