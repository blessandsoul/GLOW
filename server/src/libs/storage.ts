import { randomUUID } from 'node:crypto';
import { writeFile, mkdir, unlink, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';
import { BadRequestError } from '@/shared/errors/errors.js';

const UPLOAD_ROOT = env.UPLOAD_DIR || join(process.cwd(), 'uploads');

// ── Types ──

export interface StorageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;
type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// ── Storage API ──

/**
 * Save a file buffer to `uploads/{folder}/{uuid}.{ext}` and return the URL path.
 */
export async function uploadFile(file: StorageFile, folder: string): Promise<string> {
  const ext = extname(file.filename) || '.jpg';
  const uniqueName = `${randomUUID()}${ext}`;
  const dirPath = join(UPLOAD_ROOT, folder);

  await mkdir(dirPath, { recursive: true });
  await writeFile(join(dirPath, uniqueName), file.buffer);

  return `/uploads/${folder}/${uniqueName}`;
}

/**
 * Delete a file previously stored via `uploadFile`.
 * Accepts the URL path returned by `uploadFile` (e.g. `/uploads/avatars/abc.jpg`).
 * Silently ignores files that no longer exist.
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) return;

  const filePath = join(process.cwd(), url);
  try {
    await access(filePath);
    await unlink(filePath);
  } catch {
    logger.warn({ filePath }, 'File not found for deletion');
  }
}

/**
 * Resolve a relative upload path to a full URL using APP_URL.
 */
export function getFileUrl(relativePath: string): string {
  return `${env.APP_URL}${relativePath}`;
}

/**
 * Convert HEIC/HEIF images to JPEG. Pass-through for other formats.
 */
export async function processImage(file: StorageFile): Promise<StorageFile> {
  if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
    const buffer = await sharp(file.buffer).jpeg({ quality: 90 }).toBuffer();
    const filename = file.filename.replace(/\.hei[cf]$/i, '.jpg');
    return { buffer, filename, mimetype: 'image/jpeg' };
  }
  return file;
}

/**
 * Validate an image file (type + size). Throws `BadRequestError` on failure.
 */
export function validateImage(
  file: StorageFile,
  maxSize: number = DEFAULT_MAX_SIZE,
): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype as AllowedImageType)) {
    throw new BadRequestError(
      'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC, HEIF',
      'INVALID_FILE_TYPE',
    );
  }

  if (file.buffer.length > maxSize) {
    throw new BadRequestError(
      `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`,
      'FILE_TOO_LARGE',
    );
  }
}
