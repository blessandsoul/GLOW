import type { FastifyInstance } from 'fastify';
import { chatController } from './chat.controller.js';

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  // Public endpoint — no auth required (visitors can use the chat)
  app.post('/message', chatController.sendMessage);
}
