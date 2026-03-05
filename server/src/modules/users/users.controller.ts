import type { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateUserSchema, DeleteAccountSchema } from './users.schemas.js';
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

    async deleteAccountRequestOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const result = await usersService.deleteAccountRequestOtp(request.user!.id);
      reply.send(successResponse('Verification code sent', { requestId: result.requestId }));
    },

    async deleteMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const input = DeleteAccountSchema.parse(request.body);
      await usersService.deleteAccount(request.user!.id, input);
      clearAuthCookies(reply);
      reply.send(successResponse('Account deleted', null));
    },
  };
}
