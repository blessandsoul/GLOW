import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReportProblemSchema } from './notifications.schemas.js';
import { notificationsService } from './notifications.service.js';
import { successResponse } from '@shared/responses/successResponse.js';

export const notificationsController = {
  async reportProblem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { phone, message, jobId } = ReportProblemSchema.parse(request.body);
    const clientIp = request.ip;

    await notificationsService.reportProblem(phone, message, clientIp, jobId);

    await reply.send(successResponse('Report submitted successfully', null));
  },
};
