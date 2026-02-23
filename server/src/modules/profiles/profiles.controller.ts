import type { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateProfileSchema } from './profiles.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { ProfilesService } from './profiles.service.js';

export function createProfilesController(profilesService: ProfilesService) {
  return {
    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const profile = await profilesService.getProfile(request.user!.id);
      reply.send(successResponse('Profile retrieved', profile));
    },

    async saveMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = UpdateProfileSchema.parse(request.body);
      const profile = await profilesService.saveProfile(request.user!.id, input);
      reply.send(successResponse('Profile saved', profile));
    },
  };
}
