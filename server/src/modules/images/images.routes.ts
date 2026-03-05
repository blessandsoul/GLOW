import type { FastifyInstance } from 'fastify';
import { imagesController } from './images.controller.js';

export async function imagesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/thumb', imagesController.getThumb);
}
