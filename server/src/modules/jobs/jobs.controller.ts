import type { FastifyRequest, FastifyReply } from 'fastify';
import { JobIdParamSchema, DownloadQuerySchema, ListJobsQuerySchema, ListResultsQuerySchema, BatchSettingsSchema, BulkDeleteSchema, PrepareHDQuerySchema } from './jobs.schemas.js';
import { jobsService } from './jobs.service.js';
import { BadRequestError } from '../../shared/errors/errors.js';
import { isLaunchMode, getDailyUsage } from '../../libs/launch-mode.js';
import { successResponse } from '../../shared/responses/successResponse.js';
import { paginatedResponse } from '../../shared/responses/paginatedResponse.js';
import type { JwtPayload } from '../../shared/types/index.js';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const jobsController = {
  async download(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = JobIdParamSchema.parse(request.params);
    const { variant, branded, upscale } = DownloadQuerySchema.parse(request.query);

    const user = request.user as JwtPayload | undefined;

    const { buffer, filename, contentType } = await jobsService.downloadJobResult(
      jobId,
      variant,
      user?.id,
      branded === 1,
      upscale === 1,
    );

    await reply
      .header('Content-Type', contentType)
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Cache-Control', 'no-store')
      .send(buffer);
  },

  async prepareHD(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = JobIdParamSchema.parse(request.params);
    const { variant } = PrepareHDQuerySchema.parse(request.query);
    const user = request.user as JwtPayload | undefined;

    const result = await jobsService.prepareHD(jobId, variant, user?.id);
    await reply.send(successResponse('HD image ready', result));
  },

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await request.file();
    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }
    const fileBuffer = await data.toBuffer();
    // Read fields from the multipart file object (not request.body) so fields
    // that appear after the file part in the form data are captured correctly.
    const fields = data.fields as Record<string, { value: string } | undefined> | undefined;
    const settingsField = fields?.settings;
    const settingsStr = settingsField ? settingsField.value : undefined;

    // Extract processingType from settings if provided
    let processingType = 'ENHANCE';
    if (settingsStr) {
      try {
        const parsed = JSON.parse(settingsStr) as Record<string, unknown>;
        if (typeof parsed.processingType === 'string') {
          processingType = parsed.processingType;
        }
      } catch {
        // Ignore parse errors — service handles them
      }
    }

    const user = request.user as JwtPayload | undefined;
    const job = await jobsService.createJobFromFile(fileBuffer, data.mimetype, settingsStr, user?.id, processingType);
    await reply.status(201).send(successResponse('Job created', job));
  },

  async createGuest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await request.file();
    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }
    const fileBuffer = await data.toBuffer();
    const fields = data.fields as Record<string, { value: string } | undefined> | undefined;

    const settingsStr = fields?.settings ? fields.settings.value : undefined;
    const sessionId = fields?.sessionId ? fields.sessionId.value : undefined;

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
    const { page, limit, status } = ListJobsQuerySchema.parse(request.query);
    const filters = status ? { status } : undefined;
    const { items, total } = await jobsService.listUserJobs(user.id, page, limit, filters);
    await reply.send(paginatedResponse('Jobs retrieved', items, page, limit, total));
  },

  async listResults(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const images = await jobsService.getResultImages(user.id);
    await reply.send(successResponse('Result images retrieved', images));
  },

  async delete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobId } = JobIdParamSchema.parse(request.params);
    const user = request.user as JwtPayload;
    await jobsService.deleteJob(jobId, user.id);
    await reply.send(successResponse('Job deleted', null));
  },

  async bulkDelete(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { jobIds } = BulkDeleteSchema.parse(request.body);
    const user = request.user as JwtPayload;
    const result = await jobsService.bulkDeleteJobs(jobIds, user.id);
    await reply.send(successResponse('Jobs deleted', result));
  },

  async stats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const data = await jobsService.getDashboardStats(user.id);
    await reply.send(successResponse('Dashboard stats', data));
  },

  async dailyUsage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    if (!isLaunchMode()) {
      await reply.send(successResponse('Not in launch mode', null));
      return;
    }
    const usage = await getDailyUsage(user.id);
    await reply.send(successResponse('Daily usage', usage));
  },

  async createBatch(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as JwtPayload;
    const files: Array<{ buffer: Buffer; mimeType: string }> = [];
    let settingsStr: string | undefined;

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        if (!ALLOWED_MIMETYPES.includes(part.mimetype)) {
          throw new BadRequestError(`File type ${part.mimetype} is not allowed`, 'INVALID_FILE_TYPE');
        }
        const buffer = await part.toBuffer();
        if (buffer.length > MAX_FILE_BYTES) {
          throw new BadRequestError('File exceeds 5 MB limit', 'FILE_TOO_LARGE');
        }
        files.push({ buffer, mimeType: part.mimetype });
      } else if (part.type === 'field' && part.fieldname === 'settings') {
        settingsStr = String(part.value);
      }
    }

    const { settings } = BatchSettingsSchema.parse({ settings: settingsStr });

    // Extract processingType from settings if provided
    let processingType = 'ENHANCE';
    if (settings) {
      try {
        const parsed = JSON.parse(settings) as Record<string, unknown>;
        if (typeof parsed.processingType === 'string') {
          processingType = parsed.processingType;
        }
      } catch {
        // Ignore parse errors
      }
    }

    const result = await jobsService.createBatch(files, settings, user.id, processingType);
    await reply.status(201).send(successResponse('Batch jobs created', result));
  },
};
