import { buildApp } from '@/app.js';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { prisma, disconnectPrisma } from '@/libs/prisma.js';
import { connectRedis, disconnectRedis } from '@/libs/redis.js';
import { emailWorker } from '@/libs/queue.js';

async function main(): Promise<void> {
  const app = await buildApp();

  // Register email worker shutdown hook
  app.addHook('onClose', async () => {
    await emailWorker.close();
  });

  // Connect Database
  try {
    await prisma.$connect();
    logger.info('MySQL connected');
  } catch (err) {
    logger.fatal({ err }, 'MySQL connection failed');
    process.exit(1);
  }

  // Connect Redis
  try {
    await connectRedis();
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed — continuing without Redis');
  }

  // Start server
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`Server running at http://${env.HOST}:${env.PORT} [${env.NODE_ENV}]`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    await app.close();
    await disconnectPrisma();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
