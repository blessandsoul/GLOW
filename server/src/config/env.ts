import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  APP_URL: z.string().url().default('http://localhost:3001'),

  RESEND_API_KEY: z.string().min(1).optional().default(''),
  EMAIL_FROM: z.string().email().default('noreply@glow.ge'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  const message = Object.entries(formatted)
    .filter(([key]) => key !== '_errors')
    .map(([key, value]) => {
      const errors = (value as { _errors?: string[] })._errors;
      return `  ${key}: ${errors?.join(', ') ?? 'invalid'}`;
    })
    .join('\n');

  // eslint-disable-next-line no-console
  console.error(`\n❌ Environment validation failed:\n${message}\n`);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
