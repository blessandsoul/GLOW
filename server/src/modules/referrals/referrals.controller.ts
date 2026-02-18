import type { FastifyRequest, FastifyReply } from 'fastify';
import { referralsService } from './referrals.service.js';
import { successResponse } from '../../shared/responses/successResponse.js';
import type { JwtPayload } from '../../shared/types/index.js';

export const referralsController = {
  async getMyStats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3001';
    const stats = await referralsService.getMyStats(user.id, appUrl);
    await reply.send(successResponse('Referral stats retrieved', stats));
  },
};
