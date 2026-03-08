import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { successResponse } from '@/shared/responses/successResponse.js';
import { filtersService } from './filters.service.js';

const SuggestVariablesBodySchema = z.object({
  variableId: z.string().min(1).max(50),
  variableLabel: z.string().min(1).max(100),
  masterPromptId: z.string().min(1).max(100),
  existingOptions: z.array(z.string().max(100)).max(20).default([]),
});

export const filtersController = {
  async getFilters(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const metadata = filtersService.getMetadata();
    reply.send(successResponse('Filters retrieved successfully', metadata));
  },

  async suggestVariables(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = SuggestVariablesBodySchema.parse(request.body);
    const suggestions = await filtersService.suggestVariableOptions(body);
    await reply.send(successResponse('Variable suggestions generated', suggestions));
  },
};
