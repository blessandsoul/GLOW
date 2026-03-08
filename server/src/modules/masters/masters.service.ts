import { mastersRepo } from './masters.repo.js';

export function createMastersService() {
  return {
    async getFeaturedMasters(limit: number = 12) {
      return mastersRepo.findFeaturedMasters(limit);
    },
  };
}

export type MastersService = ReturnType<typeof createMastersService>;
