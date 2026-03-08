import type { FastifyRequest, FastifyReply } from 'fastify';
import { SuggestDecorationsBodySchema } from './decorations.schemas.js';
import { decorationsService } from './decorations.service.js';
import { decorationsRepo } from './decorations.repo.js';
import { successResponse } from '../../shared/responses/successResponse.js';
import { logger } from '../../libs/logger.js';

export const decorationsController = {
  async suggest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { niche } = SuggestDecorationsBodySchema.parse(request.body);
    const suggestions = await decorationsService.getSuggestions(niche);
    await reply.send(successResponse('Decoration suggestions generated', suggestions));
  },

  async poolStatus(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const counts = await decorationsRepo.getNicheCounts();
    await reply.send(successResponse('Decoration pool status', { counts }));
  },

  async replenish(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const counts = await decorationsRepo.getNicheCounts();
    // Fire and forget — don't make admin wait
    decorationsService.replenishAllNiches().catch(err => {
      logger.error({ err }, 'Manual decoration replenishment failed');
    });
    await reply.send(successResponse('Decoration replenishment started', { currentCounts: counts }));
  },
};
