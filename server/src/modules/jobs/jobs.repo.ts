import { prisma } from '../../libs/prisma.js';

export const jobsRepo = {
  async findJobByIdWithUser(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            subscription: {
              select: {
                plan: true,
              },
            },
          },
        },
      },
    });
  },
};
