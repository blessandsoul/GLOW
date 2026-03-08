import { prisma } from '../../libs/prisma.js';

export const filtersRepo = {
  async getRandomByVariable(variableId: string, count: number) {
    return prisma.$queryRaw`
      SELECT id, variable_id AS variableId, label_en AS labelEn, label_ru AS labelRu, label_ka AS labelKa, prompt_value AS promptValue
      FROM variable_suggestions
      WHERE variable_id = ${variableId}
      ORDER BY RAND()
      LIMIT ${count}
    ` as Promise<{ id: string; variableId: string; labelEn: string; labelRu: string; labelKa: string; promptValue: string }[]>;
  },

  async countByVariable(variableId: string): Promise<number> {
    return prisma.variableSuggestion.count({ where: { variableId } });
  },

  async insertMany(suggestions: {
    variableId: string;
    labelEn: string;
    labelRu: string;
    labelKa: string;
    promptValue: string;
  }[]): Promise<number> {
    const result = await prisma.variableSuggestion.createMany({ data: suggestions });
    return result.count;
  },

  async deleteOldestByVariable(variableId: string, keepCount: number): Promise<number> {
    const toKeep = await prisma.variableSuggestion.findMany({
      where: { variableId },
      orderBy: { createdAt: 'desc' },
      take: keepCount,
      select: { id: true },
    });
    const keepIds = toKeep.map(r => r.id);
    if (keepIds.length === 0) return 0;
    const deleted = await prisma.variableSuggestion.deleteMany({
      where: { variableId, id: { notIn: keepIds } },
    });
    return deleted.count;
  },

  async getVariableCounts(): Promise<{ variableId: string; count: number }[]> {
    const variableIds = ['BACKGROUND', 'EYE_EFFECT', 'LIP_DECOR', 'HAND_ACCESSORY', 'SKIN_FINISH', 'EXTRAS'];
    return Promise.all(
      variableIds.map(async (variableId) => ({
        variableId,
        count: await prisma.variableSuggestion.count({ where: { variableId } }),
      }))
    );
  },
};
