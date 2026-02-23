import { profilesRepo } from './profiles.repo.js';
import type { UpdateProfileInput } from './profiles.schemas.js';

export function createProfilesService() {
  return {
    async getProfile(userId: string) {
      return profilesRepo.findByUserId(userId);
    },

    async saveProfile(userId: string, input: UpdateProfileInput) {
      return profilesRepo.upsert(userId, input);
    },
  };
}

export type ProfilesService = ReturnType<typeof createProfilesService>;
