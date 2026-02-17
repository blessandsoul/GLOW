import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { AppError } from './libs/errors.js';
import { ZodError } from 'zod';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(422).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
