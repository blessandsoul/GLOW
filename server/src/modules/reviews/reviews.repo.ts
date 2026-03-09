import { prisma } from '@/libs/prisma.js';
import type { CreateReviewInput, UpdateReviewInput } from './reviews.schemas.js';

const REVIEW_SELECT = {
  id: true,
  masterId: true,
  userId: true,
  rating: true,
  text: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
} as const;

export const reviewsRepo = {
  async findByUserAndMaster(userId: string, masterId: string) {
    return prisma.review.findUnique({
      where: { userId_masterId: { userId, masterId } },
      select: REVIEW_SELECT,
    });
  },

  async findById(reviewId: string) {
    return prisma.review.findUnique({
      where: { id: reviewId },
      select: REVIEW_SELECT,
    });
  },

  async create(userId: string, data: CreateReviewInput) {
    return prisma.review.create({
      data: {
        userId,
        masterId: data.masterId,
        rating: data.rating,
        text: data.text,
      },
      select: REVIEW_SELECT,
    });
  },

  async update(reviewId: string, data: UpdateReviewInput) {
    return prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        text: data.text,
      },
      select: REVIEW_SELECT,
    });
  },

  async delete(reviewId: string) {
    return prisma.review.delete({
      where: { id: reviewId },
    });
  },

  async findByMasterId(masterId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [items, totalItems] = await prisma.$transaction([
      prisma.review.findMany({
        where: { masterId },
        select: REVIEW_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.review.count({ where: { masterId } }),
    ]);

    return { items, totalItems };
  },

  async masterExists(masterId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: masterId, isActive: true, deletedAt: null, masterProfile: { isNot: null } },
      select: { id: true },
    });
    return user !== null;
  },

  async getStats(masterId: string): Promise<{ count: number; average: number }> {
    const result = await prisma.review.aggregate({
      where: { masterId },
      _count: true,
      _avg: { rating: true },
    });
    return {
      count: result._count,
      average: result._avg.rating ?? 0,
    };
  },
};
