import type { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateBrandingSchema } from './branding.schemas.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import type { BrandingService } from './branding.service.js';
import type { StorageFile } from '@/libs/storage.js';

export function createBrandingController(brandingService: BrandingService) {
  return {
    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const profile = await brandingService.getBranding(request.user!.id);
      reply.send(successResponse('Branding retrieved', profile));
    },

    async saveMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const fields: Record<string, string> = {};
      let logoFile: StorageFile | undefined;

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'logo') {
            const buffer = await part.toBuffer();
            logoFile = {
              buffer,
              filename: part.filename,
              mimetype: part.mimetype,
            };
          }
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const input = UpdateBrandingSchema.parse(fields);
      const profile = await brandingService.saveBranding(request.user!.id, input, logoFile);
      reply.send(successResponse('Branding saved', profile));
    },

    async deleteMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await brandingService.deleteBranding(request.user!.id);
      reply.send(successResponse('Branding deleted', null));
    },
  };
}
