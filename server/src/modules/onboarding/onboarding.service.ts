import { onboardingRepo } from './onboarding.repo.js';
import { mapUserToResponse } from '@/modules/auth/auth.repo.js';
import { forwardGeocode } from '@/libs/geocode.js';
import type { CompleteOnboardingInput } from './onboarding.schemas.js';
import type { UserResponse } from '@/modules/auth/auth.repo.js';

export function createOnboardingService() {
  return {
    async complete(userId: string, input: CompleteOnboardingInput): Promise<UserResponse> {
      // Auto-geocode workAddress if coordinates not provided
      if ('workAddress' in input && input.workAddress && input.latitude == null) {
        const coords = await forwardGeocode(input.workAddress, input.city);
        if (coords) {
          input.latitude = coords.latitude;
          input.longitude = coords.longitude;
        }
      }
      const consents = {
        smsAppointments: input.smsAppointments,
        smsPromotions: input.smsPromotions,
        smsNews: input.smsNews,
      };

      let rawUser;

      switch (input.role) {
        case 'USER': {
          const metadata: Record<string, unknown> = {};
          if (input.city) metadata.city = input.city;
          if (input.dateOfBirth) metadata.dateOfBirth = input.dateOfBirth;
          if (input.interestedCategories) metadata.interestedCategories = input.interestedCategories;
          if (input.visitFrequency) metadata.visitFrequency = input.visitFrequency;
          rawUser = await onboardingRepo.completeAsUser(userId, metadata, consents);
          break;
        }

        case 'MASTER': {
          rawUser = await onboardingRepo.completeAsMaster(
            userId,
            {
              city: input.city,
              workAddress: input.workAddress,
              latitude: input.latitude,
              longitude: input.longitude,
              niches: input.niches,
              experienceYears: input.experienceYears,
              services: input.services,
            },
            consents,
          );
          break;
        }

        case 'SALON': {
          rawUser = await onboardingRepo.completeAsSalon(
            userId,
            {
              salonName: input.salonName,
              city: input.city,
              workAddress: input.workAddress,
              latitude: input.latitude,
              longitude: input.longitude,
              serviceCategories: input.serviceCategories,
            },
            consents,
          );
          break;
        }
      }

      return mapUserToResponse({ ...rawUser, hasPassword: true });
    },
  };
}

export type OnboardingService = ReturnType<typeof createOnboardingService>;
