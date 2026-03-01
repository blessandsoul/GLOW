import type { FastifyInstance } from 'fastify';
import { decorationsController } from './decorations.controller.js';
import { authenticate } from '../../libs/auth.js';

export async function decorationsRoutes(app: FastifyInstance): Promise<void> {
  // Generate AI decoration suggestions
  app.post('/suggest', { preHandler: [authenticate] }, decorationsController.suggest);
}
