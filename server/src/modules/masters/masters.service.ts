import { mastersRepo } from './masters.repo.js';
import type { CatalogFilters } from './masters.repo.js';

export function createMastersService() {
  return {
    async getFeaturedMasters(limit: number = 12, niche?: string) {
      return mastersRepo.findFeaturedMasters(limit, niche);
    },

    async getCatalogMasters(filters: CatalogFilters) {
      return mastersRepo.findCatalogMasters(filters);
    },
  };
}

export type MastersService = ReturnType<typeof createMastersService>;
