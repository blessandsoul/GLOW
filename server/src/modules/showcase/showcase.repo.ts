import { prisma } from '@/libs/prisma.js';

export const showcaseRepo = {
  async findJobForShowcase(jobId: string) {
    return prisma.job.findFirst({
      where: {
        id: jobId,
        status: 'DONE',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            brandingProfile: {
              select: {
                displayName: true,
                instagramHandle: true,
              },
            },
          },
        },
      },
    });
  },

  async createReview(data: {
    jobId: string;
    masterId: string;
    rating: number;
    text?: string;
    clientName?: string;
  }) {
    return prisma.review.create({
      data: {
        jobId: data.jobId,
        masterId: data.masterId,
        rating: data.rating,
        text: data.text,
        clientName: data.clientName,
      },
    });
  },
};
