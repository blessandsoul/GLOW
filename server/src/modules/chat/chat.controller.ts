import type { FastifyRequest, FastifyReply } from 'fastify';
import { SendChatMessageSchema } from './chat.schemas.js';
import { chatService } from './chat.service.js';
import { successResponse } from '@shared/responses/successResponse.js';

export const chatController = {
  async sendMessage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { message, language, currentPage } = SendChatMessageSchema.parse(request.body);

    // Extract history from body (validated separately to keep schema clean)
    const body = request.body as Record<string, unknown>;
    const rawHistory = Array.isArray(body.history) ? body.history : [];

    // Sanitize history — only allow valid role/content pairs, limit length
    const history = rawHistory
      .filter(
        (msg): msg is { role: string; content: string } =>
          typeof msg === 'object' &&
          msg !== null &&
          'role' in msg &&
          'content' in msg &&
          typeof (msg as Record<string, unknown>).role === 'string' &&
          typeof (msg as Record<string, unknown>).content === 'string' &&
          ['user', 'assistant'].includes((msg as Record<string, unknown>).role as string),
      )
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        // Strip HTML and limit content length per message
        content: String(msg.content).replace(/<[^>]*>/g, '').slice(0, 500),
      }));

    const clientIp = request.ip;

    const result = await chatService.sendMessage(message, history, language, clientIp, currentPage);

    await reply.send(successResponse('Chat reply generated', result));
  },
};
