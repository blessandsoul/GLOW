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
    batchId?: string;
    processingType?: string;
    creditCost?: number;
  }) {
    return prisma.job.create({
      data: {
        userId: data.userId ?? null,
        originalUrl: data.originalUrl,
        settings: data.settings ?? undefined,
        status: data.status ?? 'PENDING',
        results: data.results ? data.results : undefined,
        batchId: data.batchId ?? null,
        processingType: data.processingType ?? 'ENHANCE',
        creditCost: data.creditCost ?? 1,
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

  async findByUserId(userId: string, page: number, limit: number, filters?: { status?: string }) {
    const where: { userId: string; status?: string } = { userId };
    if (filters?.status) {
      where.status = filters.status;
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);
    return { items, total };
  },

  async findByBatchId(batchId: string) {
    return prisma.job.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findDoneResultsByUserId(userId: string) {
    return prisma.job.findMany({
      where: { userId, status: 'DONE' },
      select: { id: true, results: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.creditTransaction.deleteMany({ where: { jobId: id } });
      await tx.caption.deleteMany({ where: { jobId: id } });
      await tx.review.deleteMany({ where: { jobId: id } });
      await tx.portfolioItem.deleteMany({ where: { jobId: id } });
      await tx.scheduledPost.deleteMany({ where: { jobId: id } });

      return tx.job.deleteMany({ where: { id, userId } });
    });
    return result.count > 0;
  },

  async deleteManyByIdsAndUserId(ids: string[], userId: string): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      await tx.creditTransaction.deleteMany({ where: { jobId: { in: ids } } });
      await tx.caption.deleteMany({ where: { jobId: { in: ids } } });
      await tx.review.deleteMany({ where: { jobId: { in: ids } } });
      await tx.portfolioItem.deleteMany({ where: { jobId: { in: ids } } });
      await tx.scheduledPost.deleteMany({ where: { jobId: { in: ids } } });

      return tx.job.deleteMany({ where: { id: { in: ids }, userId } });
    });
    return result.count;
  },

  async getStatsByUserId(userId: string): Promise<{ totalJobs: number; totalDone: number; totalResults: number }> {
    const [totalJobs, totalDone, doneJobs] = await Promise.all([
      prisma.job.count({ where: { userId } }),
      prisma.job.count({ where: { userId, status: 'DONE' } }),
      prisma.job.findMany({
        where: { userId, status: 'DONE' },
        select: { results: true },
      }),
    ]);

    let totalResults = 0;
    for (const job of doneJobs) {
      const results = job.results as string[] | null;
      if (results) {
        totalResults += results.length;
      }
    }

    return { totalJobs, totalDone, totalResults };
  },
};
