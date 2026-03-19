import type { FastifyInstance } from 'fastify';
import { favoritesController } from './favorites.controller.js';
import { authenticate } from '@/libs/auth.js';

export async function favoritesRoutes(app: FastifyInstance): Promise<void> {
  // All favorites routes require authentication
  const auth = { preHandler: [authenticate] };

  // Masters
  app.post('/masters/:masterProfileId', auth, favoritesController.addMaster);
  app.delete('/masters/:masterProfileId', auth, favoritesController.removeMaster);
  app.get('/masters', auth, favoritesController.listFavoriteMasters);

  // Portfolio items
  app.post('/portfolio/:portfolioItemId', auth, favoritesController.addPortfolioItem);
  app.delete('/portfolio/:portfolioItemId', auth, favoritesController.removePortfolioItem);
  app.get('/portfolio', auth, favoritesController.listFavoritePortfolioItems);

  // Batch status check
  app.get('/status', auth, favoritesController.getStatus);
}
