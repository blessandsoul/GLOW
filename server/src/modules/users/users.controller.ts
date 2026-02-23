import type { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateUserSchema } from './users.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { BadRequestError } from '@/shared/errors/errors.js';
import { clearAuthCookies } from '@/modules/auth/auth.cookies.js';
import type { UsersService } from './users.service.js';

export function createUsersController(usersService: UsersService) {
  return {
    async updateMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = UpdateUserSchema.parse(request.body);
      const user = await usersService.updateUser(request.user!.id, input);
      reply.send(successResponse('Profile updated', user));
    },

    async uploadAvatar(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const file = await request.file();
      if (!file) {
        throw new BadRequestError('No file uploaded', 'NO_FILE');
      }

      const { avatarUrl } = await usersService.uploadAvatar(request.user!.id, file);
      reply.send(successResponse('Avatar updated', { avatarUrl }));
    },

    async deleteMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await usersService.deleteAccount(request.user!.id);
      clearAuthCookies(reply);
      reply.send(successResponse('Account deleted', null));
    },
  };
}
