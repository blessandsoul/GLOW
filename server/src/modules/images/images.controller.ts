import type { FastifyRequest, FastifyReply } from 'fastify';
import { thumbQuerySchema } from './images.schemas.js';
import { getThumbnail } from './images.service.js';

export const imagesController = {
  async getThumb(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { url, w } = thumbQuerySchema.parse(request.query);
    const { buffer, contentType } = await getThumbnail(url, w);
    reply
      .header('Content-Type', contentType)
      .header('Cache-Control', 'public, max-age=86400, immutable')
      .send(buffer);
  },
};
