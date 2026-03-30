import type { FastifyInstance } from 'fastify';
import { authenticate, authorize, requirePhoneVerified } from '@/libs/auth.js';
import { createMarketplaceController } from './marketplace.controller.js';
import { createMarketplaceService } from './marketplace.service.js';

export async function marketplaceRoutes(app: FastifyInstance): Promise<void> {
  const service = createMarketplaceService();
  const controller = createMarketplaceController(service);

  const authGuard = [authenticate, requirePhoneVerified];
  const adminGuard = [authenticate, authorize('ADMIN'), requirePhoneVerified];

  // Seller application
  app.get('/seller/status', { preHandler: authGuard }, controller.getSellerStatus);
  app.post('/seller/apply', { preHandler: authGuard }, controller.applySeller);

  // Admin seller queue
  app.get('/admin/sellers', { preHandler: adminGuard }, controller.adminGetSellers);
  app.post('/admin/sellers/:userId/review', { preHandler: adminGuard }, controller.adminReviewSeller);

  // Product CRUD (seller-only enforced in service)
  app.get('/products/me', { preHandler: authGuard }, controller.getMyProducts);
  app.post('/products', { preHandler: authGuard }, controller.createProduct);
  app.post('/products/:id/images', { preHandler: authGuard }, controller.uploadProductImage);
  app.patch('/products/:id', { preHandler: authGuard }, controller.updateProduct);
  app.delete('/products/:id', { preHandler: authGuard }, controller.deleteProduct);

  // Browse (any authenticated user)
  app.get('/products', { preHandler: [authenticate] }, controller.getProducts);
  app.get('/products/:id', { preHandler: [authenticate] }, controller.getProduct);
  app.get('/sellers/:username/products', { preHandler: [authenticate] }, controller.getSellerProducts);
}
