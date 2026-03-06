import { prisma } from '../../libs/prisma.js';

export const decorationsRepo = {
  async getRandomByNiche(niche: string, count: number) {
    // Use Prisma raw query with MySQL RAND() for random selection
    return prisma.$queryRaw`
      SELECT id, niche, label_en AS labelEn, label_ru AS labelRu, label_ka AS labelKa, prompt_value AS promptValue
      FROM decoration_suggestions
      WHERE niche = ${niche}
      ORDER BY RAND()
      LIMIT ${count}
    ` as Promise<{ id: string; niche: string; labelEn: string; labelRu: string; labelKa: string; promptValue: string }[]>;
  },

  async countByNiche(niche: string): Promise<number> {
    return prisma.decorationSuggestion.count({ where: { niche } });
  },

  async insertMany(suggestions: {
    niche: string;
    labelEn: string;
    labelRu: string;
    labelKa: string;
    promptValue: string;
  }[]): Promise<number> {
    const result = await prisma.decorationSuggestion.createMany({ data: suggestions });
    return result.count;
  },

  async deleteOldestByNiche(niche: string, keepCount: number): Promise<number> {
    const toKeep = await prisma.decorationSuggestion.findMany({
      where: { niche },
      orderBy: { createdAt: 'desc' },
      take: keepCount,
      select: { id: true },
    });
    const keepIds = toKeep.map(r => r.id);
    if (keepIds.length === 0) return 0;
    const deleted = await prisma.decorationSuggestion.deleteMany({
      where: { niche, id: { notIn: keepIds } },
    });
    return deleted.count;
  },

  async getNicheCounts(): Promise<{ niche: string; count: number }[]> {
    const niches = ['hair', 'eyes', 'lips', 'nails', 'skin', 'general'];
    return Promise.all(
      niches.map(async (niche) => ({
        niche,
        count: await prisma.decorationSuggestion.count({ where: { niche } }),
      }))
    );
  },
};
