import type { FastifyRequest, FastifyReply } from 'fastify';
import { SuggestDecorationsBodySchema } from './decorations.schemas.js';
import { decorationsService } from './decorations.service.js';
import { successResponse } from '../../shared/responses/successResponse.js';

export const decorationsController = {
  async suggest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { niche } = SuggestDecorationsBodySchema.parse(request.body);
    const suggestions = await decorationsService.suggestDecorations(niche);
    await reply.send(successResponse('Decoration suggestions generated', suggestions));
  },
};
