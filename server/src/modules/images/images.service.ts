import sharp from 'sharp';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { NotFoundError } from '@/shared/errors/errors.js';
import { logger } from '@/libs/logger.js';

interface ThumbnailResult {
  buffer: Buffer;
  contentType: string;
}

export async function getThumbnail(url: string, width: number): Promise<ThumbnailResult> {
  // Security: ensure url starts with /uploads/ to prevent path traversal
  if (!url.startsWith('/uploads/')) {
    throw new NotFoundError('Image not found');
  }

  // Compute cache key from url + width
  const hash = createHash('sha256').update(`${url}:${width}`).digest('hex');
  const thumbsDir = join(process.cwd(), 'uploads', 'thumbs');
  const cachedPath = join(thumbsDir, `${hash}.webp`);

  // Check if cached thumbnail exists
  try {
    await access(cachedPath);
    const buffer = await readFile(cachedPath);
    return { buffer, contentType: 'image/webp' };
  } catch {
    // Not cached, generate thumbnail
  }

  // Resolve original file path
  const originalPath = join(process.cwd(), url);

  let originalBuffer: Buffer;
  try {
    originalBuffer = await readFile(originalPath);
  } catch {
    throw new NotFoundError('Image not found');
  }

  // Generate thumbnail
  const buffer = await sharp(originalBuffer)
    .resize(width)
    .webp({ quality: 80 })
    .toBuffer();

  // Ensure thumbs directory exists and save cached thumbnail
  try {
    await mkdir(thumbsDir, { recursive: true });
    await writeFile(cachedPath, buffer);
  } catch (err) {
    logger.warn({ err, cachedPath }, 'Failed to cache thumbnail');
  }

  return { buffer, contentType: 'image/webp' };
}
