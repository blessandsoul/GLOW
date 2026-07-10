import { profilesRepo } from './profiles.repo.js';
import { forwardGeocode } from '@/libs/geocode.js';
import type { UpdateProfileInput } from './profiles.schemas.js';
import { env } from '@/config/env.js';
import { BadRequestError } from '@/shared/errors/errors.js';

export function createProfilesService() {
  return {
    async getProfile(userId: string) {
      return profilesRepo.findByUserId(userId);
    },

    async saveProfile(userId: string, input: UpdateProfileInput) {
      if (input.bookingPaymentChannel === 'FLITT' && !env.BOOKING_ONLINE_PAYMENTS_ENABLED) {
        const existing = await profilesRepo.findByUserId(userId);
        if (existing?.bookingPaymentChannel !== 'FLITT') {
          throw new BadRequestError('Online booking payments are not enabled yet', 'ONLINE_PAYMENTS_DISABLED');
        }
      }
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
