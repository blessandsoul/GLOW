import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { AppError } from '@/shared/errors/AppError.js';
import { successResponse } from '@/shared/responses/successResponse.js';
import { authRoutes } from '@/modules/auth/auth.routes.js';
import { jobsRoutes } from '@/modules/jobs/jobs.routes.js';
import { showcaseRoutes } from '@/modules/showcase/showcase.routes.js';
import { referralsRoutes } from '@/modules/referrals/referrals.routes.js';
import { creditsRoutes } from '@/modules/credits/credits.routes.js';
import { usersRoutes } from '@/modules/users/users.routes.js';
import { profilesRoutes } from '@/modules/profiles/profiles.routes.js';
import { brandingRoutes } from '@/modules/branding/branding.routes.js';
import { portfolioRoutes } from '@/modules/portfolio/portfolio.routes.js';
import { trendsRoutes } from '@/modules/trends/trends.routes.js';
import { filtersRoutes } from '@/modules/filters/filters.routes.js';
import { ZodError } from 'zod';

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use our own pino instance
  });

  // ── Plugins ──
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(cookie);

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'accessToken',
      signed: false,
    },
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
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
  await app.register(showcaseRoutes, { prefix: '/api/v1/showcase' });
  await app.register(referralsRoutes, { prefix: '/api/v1/referrals' });
  await app.register(creditsRoutes, { prefix: '/api/v1/credits' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(profilesRoutes, { prefix: '/api/v1/profiles' });
  await app.register(brandingRoutes, { prefix: '/api/v1/branding' });
  await app.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
  await app.register(trendsRoutes, { prefix: '/api/v1/trends' });
  await app.register(filtersRoutes, { prefix: '/api/v1/filters' });

  return app;
}
