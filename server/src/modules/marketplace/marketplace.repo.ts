import { prisma } from '@/libs/prisma.js';
import type { CreateProductInput, UpdateProductInput, ProductsQueryInput } from './marketplace.schemas.js';

const PRODUCT_SELECT = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,
  currency: true,
  category: true,
  inStock: true,
  isActive: true,
  imageUrls: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      masterProfile: {
        select: {
          whatsapp: true,
          telegram: true,
          instagram: true,
        },
      },
    },
  },
} as const;

const SELLER_SELECT = {
  userId: true,
  sellerStatus: true,
  sellerRequestedAt: true,
  sellerApprovedAt: true,
  sellerRejectedReason: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      username: true,
      phone: true,
    },
  },
} as const;

export const marketplaceRepo = {
  // ── Seller status ──

  async getSellerStatus(userId: string) {
    return prisma.masterProfile.findUnique({
      where: { userId },
      select: {
        sellerStatus: true,
        sellerRequestedAt: true,
        sellerApprovedAt: true,
        sellerRejectedReason: true,
      },
    });
  },

  async submitSellerApplication(userId: string, reason: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: {
        sellerStatus: 'PENDING',
        sellerRequestedAt: new Date(),
        sellerRejectedReason: null,
      },
      select: {
        sellerStatus: true,
        sellerRequestedAt: true,
      },
    });
  },

  async approveSellerApplication(userId: string, adminId: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: {
        sellerStatus: 'APPROVED',
        sellerApprovedAt: new Date(),
        sellerApprovedBy: adminId,
        sellerRejectedReason: null,
      },
      select: SELLER_SELECT,
    });
  },

  async rejectSellerApplication(userId: string, reason: string) {
    return prisma.masterProfile.update({
      where: { userId },
      data: {
        sellerStatus: 'REJECTED',
        sellerRejectedReason: reason,
        sellerApprovedAt: null,
        sellerApprovedBy: null,
      },
      select: SELLER_SELECT,
    });
  },

  async findSellerApplications(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { sellerStatus: status } : { sellerStatus: { not: 'NONE' } };

    const [items, totalItems] = await Promise.all([
      prisma.masterProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sellerRequestedAt: 'desc' },
        select: SELLER_SELECT,
      }),
      prisma.masterProfile.count({ where }),
    ]);

    return { items, totalItems };
  },

  // ── Products ──

  async createProduct(userId: string, data: CreateProductInput) {
    const maxSort = await prisma.product.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

    return prisma.product.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency ?? 'GEL',
        category: data.category,
        inStock: data.inStock ?? true,
        imageUrls: data.imageUrls,
        sortOrder,
      },
      select: PRODUCT_SELECT,
    });
  },

  async updateProduct(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.inStock !== undefined && { inStock: data.inStock }),
        ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
      },
      select: PRODUCT_SELECT,
    });
  },

  async deleteProduct(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  async findProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });
  },

  async findMyProducts(userId: string) {
    return prisma.product.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: PRODUCT_SELECT,
    });
  },

  async findProducts(filters: ProductsQueryInput) {
    const { page, limit, category, inStock, userId } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (inStock !== undefined) where.inStock = inStock;
    if (userId) where.userId = userId;

    const [items, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: PRODUCT_SELECT,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, totalItems };
  },

  async findProductsByUsername(username: string) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        user: { username },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: PRODUCT_SELECT,
    });
  },

  async addImageUrls(id: string, currentUrls: string[], newUrls: string[]) {
    return prisma.product.update({
      where: { id },
      data: { imageUrls: [...currentUrls, ...newUrls] },
      select: PRODUCT_SELECT,
    });
  },
};
