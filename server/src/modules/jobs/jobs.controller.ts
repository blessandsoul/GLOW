import type { FastifyRequest, FastifyReply } from 'fastify';
import { JobIdParamSchema, DownloadQuerySchema, ListJobsQuerySchema } from './jobs.schemas.js';
import { jobsService } from './jobs.service.js';
import { BadRequestError } from '../../shared/errors/errors.js';
import { successResponse } from '../../shared/responses/successResponse.js';
import { paginatedResponse } from '../../shared/responses/paginatedResponse.js';
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

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await request.file();
    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }
    const fileBuffer = await data.toBuffer();
    const fields = request.body as Record<string, { value: string } | string> | undefined;
    const settingsStr = fields?.settings
      ? typeof fields.settings === 'object'
        ? (fields.settings as { value: string }).value
        : (fields.settings as string)
      : undefined;

    const user = request.user as JwtPayload | undefined;
    const job = await jobsService.createJobFromFile(fileBuffer, data.mimetype, settingsStr, user?.id);
    await reply.status(201).send(successResponse('Job created', job));
  },

  async createGuest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await request.file();
    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }
    const fileBuffer = await data.toBuffer();
    const fields = request.body as Record<string, { value: string } | string> | undefined;

    const settingsStr = fields?.settings
      ? typeof fields.settings === 'object'
        ? (fields.settings as { value: string }).value
        : (fields.settings as string)
      : undefined;

    const sessionId = fields?.sessionId
      ? typeof fields.sessionId === 'object'
        ? (fields.sessionId as { value: string }).value
        : (fields.sessionId as string)
      : undefined;

    if (!sessionId) {
      throw new BadRequestError('Session ID required for guest demo', 'NO_SESSION');
    }

    const job = await jobsService.createGuestJob(fileBuffer, data.mimetype, settingsStr, sessionId);
    await reply.status(201).send(successResponse('Guest job created', job));
  },

  async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = JobIdParamSchema.parse(request.params);
    const user = request.user as JwtPayload | undefined;
    const job = await jobsService.getJobById(jobId, user?.id);
    await reply.send(successResponse('Job retrieved', job));
  },

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const { page, limit } = ListJobsQuerySchema.parse(request.query);
    const { items, total } = await jobsService.listUserJobs(user.id, page, limit);
    await reply.send(paginatedResponse('Jobs retrieved', items, page, limit, total));
  },

  async createBatch(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const files: Array<{ buffer: Buffer; mimeType: string }> = [];
    let settingsStr: string | undefined;

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        files.push({ buffer, mimeType: part.mimetype });
      } else if (part.type === 'field' && part.fieldname === 'settings') {
        settingsStr = String(part.value);
      }
    }

    const result = await jobsService.createBatch(files, settingsStr, user.id);
    await reply.status(201).send(successResponse('Batch jobs created', result));
  },
};
