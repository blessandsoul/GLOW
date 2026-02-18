import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { AppError } from '@/shared/errors/AppError.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { authRoutes } from '@/modules/auth/auth.routes.js';
import { jobsRoutes } from '@/modules/jobs/jobs.routes.js';
import { ZodError } from 'zod';

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use our own pino instance
  });

  // ── Plugins ──
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  // ── Global error handler ──
  app.setErrorHandler((error, request, reply) => {
    // AppError (our typed errors)
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      reply.status(422).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: messages.join('; '),
        },
      });
      return;
    }

    // Fastify validation errors
    if (error.validation) {
      reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
      return;
    }

    // Unexpected errors
    logger.error({ err: error, url: request.url, method: request.method }, 'Unhandled error');
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  // ── Health check ──
  app.get('/api/v1/health', async (_request, reply) => {
    reply.send(
      successResponse('Server is healthy', {
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    );
  });

  // ── Routes ──
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(jobsRoutes, { prefix: '/api/v1/jobs' });

  return app;
}
