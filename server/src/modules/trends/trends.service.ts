import { trendsRepo } from './trends.repo.js';

export function createTrendsService() {
  return {
    async getCurrentTrends() {
      return trendsRepo.findActive();
    },

    async getArchive(page: number, limit: number) {
      return trendsRepo.findArchived(page, limit);
    },
  };
}

export type TrendsService = ReturnType<typeof createTrendsService>;
