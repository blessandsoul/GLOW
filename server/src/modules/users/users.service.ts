import { usersRepo } from './users.repo.js';
import { mapUserToResponse } from '@/modules/auth/auth.repo.js';
import { NotFoundError, BadRequestError, ConflictError } from '@/shared/errors/errors.js';
import { uploadFile, deleteFile, validateImage } from '@/libs/storage.js';
import { sendOtp, verifyOtp } from '@/libs/otp.js';
import type { StorageFile } from '@/libs/storage.js';
import type { UpdateUserInput, DeleteAccountInput } from './users.schemas.js';
import type { MultipartFile } from '@fastify/multipart';

const USERNAME_COOLDOWN_DAYS = 30;

export function createUsersService() {
  return {
    async updateUser(userId: string, input: UpdateUserInput) {
      const user = await usersRepo.findUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      // Handle username change
      if (input.username && input.username !== user.username) {
        // Check cooldown — can only change once per 30 days
        const lastChange = await usersRepo.getLastUsernameChange(userId);
        if (lastChange) {
          const cooldownEnd = new Date(lastChange.createdAt);
          cooldownEnd.setDate(cooldownEnd.getDate() + USERNAME_COOLDOWN_DAYS);
          if (new Date() < cooldownEnd) {
            const daysLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            throw new BadRequestError(
              `You can change your username again in ${daysLeft} days`,
              'USERNAME_COOLDOWN',
            );
          }
        }

        // Check if username is taken by another user
        const existing = await usersRepo.findUserByUsername(input.username);
        if (existing && existing.id !== userId) {
          throw new ConflictError('Username is already taken', 'USERNAME_TAKEN');
        }

        // Check if username is frozen (recently changed by someone else)
        const frozen = await usersRepo.isUsernameFrozen(input.username);
        if (frozen) {
          throw new ConflictError('This username is not available yet', 'USERNAME_FROZEN');
        }

        // Save old username to history for redirect
        if (user.username) {
          await usersRepo.saveUsernameHistory(userId, user.username);
        }
      }

      const updated = await usersRepo.updateUser(userId, input);
      return mapUserToResponse(updated);
    },

    async uploadAvatar(userId: string, file: MultipartFile) {
      const user = await usersRepo.findUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const buffer = await file.toBuffer();
      const storageFile: StorageFile = {
        buffer,
        filename: file.filename,
        mimetype: file.mimetype,
      };

      validateImage(storageFile);

      // Delete old avatar if exists
      if (user.avatar) {
        await deleteFile(user.avatar);
      }

      const avatarUrl = await uploadFile(storageFile, 'avatars');
      const updated = await usersRepo.updateAvatar(userId, avatarUrl);
      return { user: mapUserToResponse(updated), avatarUrl };
    },

    async deleteAccountRequestOtp(userId: string) {
      const user = await usersRepo.findUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }
      if (!user.phone) {
        throw new BadRequestError('A verified phone number is required to delete your account', 'NO_PHONE_NUMBER');
      }
      if (!user.phoneVerified) {
        throw new BadRequestError('Please verify your phone number first', 'PHONE_NOT_VERIFIED');
      }

      const otpResult = await sendOtp(user.phone);
      return { requestId: otpResult.requestId };
    },

    async deleteAccount(userId: string, input: DeleteAccountInput) {
      const user = await usersRepo.findUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }
      if (!user.phone || !user.phoneVerified) {
        throw new BadRequestError('A verified phone number is required', 'PHONE_NOT_VERIFIED');
      }

      // Verify OTP code
      await verifyOtp(user.phone, input.otpRequestId, input.code);

      // Delete avatar file if exists
      if (user.avatar) {
        await deleteFile(user.avatar);
      }

      await usersRepo.deleteUserRefreshTokens(userId);
      await usersRepo.softDeleteUser(userId);
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
