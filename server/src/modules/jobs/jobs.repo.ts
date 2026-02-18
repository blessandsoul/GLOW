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

  async createJob(data: {
    userId?: string;
    originalUrl: string;
    settings?: object;
    status?: string;
    results?: string[];
  }) {
    return prisma.job.create({
      data: {
        userId: data.userId ?? null,
        originalUrl: data.originalUrl,
        settings: data.settings ?? undefined,
        status: data.status ?? 'PENDING',
        results: data.results ? data.results : undefined,
      },
    });
  },

  async updateJob(id: string, data: { status: string; results?: string[] }) {
    return prisma.job.update({
      where: { id },
      data: {
        status: data.status,
        results: data.results ? data.results : undefined,
      },
    });
  },

  async findById(id: string) {
    return prisma.job.findUnique({ where: { id } });
  },

  async findByUserId(userId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where: { userId } }),
    ]);
    return { items, total };
  },
};
