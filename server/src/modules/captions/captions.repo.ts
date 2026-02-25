import { prisma } from '../../libs/prisma.js';

export const captionsRepo = {
  async findByJobId(jobId: string) {
    return prisma.caption.findFirst({
      where: { jobId, variant: 'DEFAULT', language: 'KA' },
    });
  },

  async countByJobId(jobId: string): Promise<number> {
    return prisma.caption.count({
      where: { jobId },
    });
  },

  async create(data: { jobId: string; text: string; hashtags: string }) {
    return prisma.caption.create({
      data: {
        jobId: data.jobId,
        variant: 'DEFAULT',
        language: 'KA',
        text: data.text,
        hashtags: data.hashtags,
      },
    });
  },

  async deleteByJobId(jobId: string): Promise<void> {
    await prisma.caption.deleteMany({
      where: { jobId, variant: 'DEFAULT', language: 'KA' },
    });
  },
};
