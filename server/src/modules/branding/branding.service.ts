import { brandingRepo } from './branding.repo.js';
import { NotFoundError } from '@/shared/errors/errors.js';
import { uploadFile, deleteFile, validateImage } from '@/libs/storage.js';
import type { StorageFile } from '@/libs/storage.js';
import type { UpdateBrandingInput } from './branding.schemas.js';

export function createBrandingService() {
  return {
    async getBranding(userId: string) {
      return brandingRepo.findByUserId(userId);
    },

    async saveBranding(userId: string, input: UpdateBrandingInput, logoFile?: StorageFile) {
      let logoUrl: string | undefined;

      if (logoFile) {
        validateImage(logoFile);

        // Delete old logo file if exists
        const existing = await brandingRepo.findByUserId(userId);
        if (existing?.logoUrl) {
          await deleteFile(existing.logoUrl);
        }

        logoUrl = await uploadFile(logoFile, 'branding');
      }

      const data = logoUrl ? { ...input, logoUrl } : input;
      return brandingRepo.upsert(userId, data);
    },

    async deleteBranding(userId: string) {
      const existing = await brandingRepo.findByUserId(userId);
      if (!existing) {
        throw new NotFoundError('Branding profile not found', 'BRANDING_NOT_FOUND');
      }

      // Delete logo file if exists
      if (existing.logoUrl) {
        await deleteFile(existing.logoUrl);
      }

      await brandingRepo.deleteByUserId(userId);
    },
  };
}

export type BrandingService = ReturnType<typeof createBrandingService>;
