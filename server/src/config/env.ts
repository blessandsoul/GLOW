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

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  APP_URL: z.string().url().default('http://localhost:3001'),

  RESEND_API_KEY: z.string().min(1).optional().default(''),
  EMAIL_FROM: z.string().email().default('noreply@glow.ge'),

  UPLOAD_DIR: z.string().optional(),

  // AI Image Generation — provider switch
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('gemini'),

  // OpenAI config (required when AI_PROVIDER=openai)
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_IMAGE_MODEL: z.string().default('gpt-image-1'),
  OPENAI_IMAGE_COUNT: z.coerce.number().int().min(1).max(4).default(1),
  // Switch between "low" (fast/cheap) and "high" (max quality) — controls size, quality, format, fidelity
  OPENAI_IMAGE_PRESET: z.enum(['low', 'high']).default('low'),

  // Gemini config (required when AI_PROVIDER=gemini)
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_IMAGE_MODEL: z.string().default('gemini-2.5-flash-preview-04-17'),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.5-flash'),

  // Launch mode — free-for-all with daily generation limits
  LAUNCH_MODE: z.coerce.boolean().default(false),
  LAUNCH_DAILY_LIMIT: z.coerce.number().int().min(1).default(5),

  // Watermark & Download Quality
  // Master switch for ALL watermarks (Glow.GE + custom branding). Set false to disable completely.
  WATERMARK_ENABLED: z.coerce.boolean().default(false),
  // JPEG quality when watermarks are applied (1-100). 100 = lossless-like, 95 = high, 90 = good.
  IMAGE_DOWNLOAD_QUALITY: z.coerce.number().int().min(1).max(100).default(100),
  // Output format for downloads: "png" (lossless, larger) or "jpeg" (lossy, smaller).
  // When watermark is disabled, original format is preserved regardless of this setting.
  IMAGE_DOWNLOAD_FORMAT: z.enum(['png', 'jpeg']).default('png'),

  // OTP (phone verification)
  OTP_API_KEY: z.string().min(1),
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
