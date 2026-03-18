import { profilesRepo } from './profiles.repo.js';
import { forwardGeocode } from '@/libs/geocode.js';
import type { UpdateProfileInput } from './profiles.schemas.js';

export function createProfilesService() {
  return {
    async getProfile(userId: string) {
      return profilesRepo.findByUserId(userId);
    },

    async saveProfile(userId: string, input: UpdateProfileInput) {
      // Auto-geocode workAddress if coordinates not provided
      if (input.workAddress && input.latitude == null && input.longitude == null) {
        const existing = await profilesRepo.findByUserId(userId);
        const hasCoords = existing?.latitude != null && existing?.longitude != null;
        const addressChanged = existing?.workAddress !== input.workAddress;

        if (!hasCoords || addressChanged) {
          const coords = await forwardGeocode(input.workAddress, input.city ?? existing?.city ?? undefined);
          if (coords) {
            input.latitude = coords.latitude;
            input.longitude = coords.longitude;
          }
        }
      }

      return profilesRepo.upsert(userId, input);
    },
  };
}

export type ProfilesService = ReturnType<typeof createProfilesService>;
