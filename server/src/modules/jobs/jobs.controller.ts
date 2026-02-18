import type { FastifyRequest, FastifyReply } from 'fastify';
import { JobIdParamSchema, DownloadQuerySchema } from './jobs.schemas.js';
import { jobsService } from './jobs.service.js';
import type { JwtPayload } from '../../shared/types/index.js';

export const jobsController = {
  async download(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = JobIdParamSchema.parse(request.params);
    const { variant } = DownloadQuerySchema.parse(request.query);

    const user = request.user as JwtPayload | undefined;

    const { buffer, filename } = await jobsService.downloadJobResult(
      jobId,
      variant,
      user?.id,
    );

    await reply
      .header('Content-Type', 'image/jpeg')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Cache-Control', 'no-store')
      .send(buffer);
  },
};
