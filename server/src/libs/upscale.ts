import Replicate from 'replicate';
import { env } from '../config/env.js';
import { logger } from './logger.js';
import { InternalError } from '../shared/errors/errors.js';

const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

const MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';

/**
 * Upscale an image buffer using Real-ESRGAN via Replicate.
 * Returns the upscaled image as a Buffer.
 */
export async function upscaleImage(imageBuffer: Buffer): Promise<Buffer> {
  if (!env.REPLICATE_API_TOKEN) {
    throw new InternalError('Image upscaling is not configured', 'UPSCALE_NOT_CONFIGURED');
  }

  try {
    const output = await replicate.run(MODEL, {
      input: {
        image: imageBuffer,
        scale: 2,
        face_enhance: false,
      },
    });

    // output is a FileOutput (or array with one FileOutput)
    const fileOutput = Array.isArray(output) ? output[0] : output;

    if (!fileOutput) {
      throw new InternalError('Upscale returned no output', 'UPSCALE_EMPTY');
    }

    // FileOutput has .url() and .blob() methods
    const url = typeof fileOutput === 'string' ? fileOutput : fileOutput.url();
    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalError('Failed to download upscaled image', 'UPSCALE_DOWNLOAD_FAILED');
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    if (err instanceof InternalError) throw err;

    const errMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err, message: errMessage }, 'Replicate upscale failed');
    throw new InternalError('Image upscaling failed', 'UPSCALE_FAILED');
  }
}
