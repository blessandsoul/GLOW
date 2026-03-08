import { env } from '@/config/env.js';
import { logger } from '../../libs/logger.js';
import { InternalError } from '../../shared/errors/errors.js';
import { decorationsRepo } from './decorations.repo.js';

interface GeneratedDecoration {
  label_en: string;
  label_ru: string;
  label_ka: string;
  promptValue: string;
}

const NICHE_CONTEXT: Record<string, string> = {
  hair: 'hairstyles, hair extensions, braids, updos',
  eyes: 'eye makeup, eyelash extensions, eyebrows',
  lips: 'lip makeup, lip art, lip gloss',
  nails: 'nail art, manicure, nail design',
  skin: 'skincare, facial treatments, skin glow',
  general: 'beauty photography, portrait photography',
};

const VALID_NICHES = Object.keys(NICHE_CONTEXT);
const POOL_TARGET = 50;
const POOL_MAX = 80;
const BATCH_SIZE = 10;
const SERVE_COUNT = 6;
const MIN_POOL_THRESHOLD = 6;

export const decorationsService = {
  async getSuggestions(niche: string): Promise<GeneratedDecoration[]> {
    const poolCount = await decorationsRepo.countByNiche(niche);

    if (poolCount >= MIN_POOL_THRESHOLD) {
      const rows = await decorationsRepo.getRandomByNiche(niche, SERVE_COUNT);
      return rows.map(r => ({
        label_en: r.labelEn,
        label_ru: r.labelRu,
        label_ka: r.labelKa,
        promptValue: r.promptValue,
      }));
    }

    logger.warn({ niche, poolCount }, 'Decoration pool low, falling back to live Gemini');
    return this.suggestDecorationsLive(niche);
  },

  async suggestDecorationsLive(niche: string): Promise<GeneratedDecoration[]> {
    const { getGeminiClient } = await import('../../libs/gemini.js');
    const gemini = getGeminiClient();
    const context = NICHE_CONTEXT[niche] ?? NICHE_CONTEXT.general;

    const prompt = `You are a creative beauty photo decoration expert. Generate 6 unique, creative decorative element ideas for beauty photos in the "${niche}" category (${context}).

These decorations will be digitally added to beauty photos. Think of beautiful, photogenic objects like flowers, crystals, light effects, nature elements, luxury items, etc.

Requirements:
- Each idea should be visually stunning and work well in beauty photography
- Avoid generic/common ideas like "roses" or "butterflies" — be creative and specific
- Ideas should be tasteful and elegant, matching luxury beauty aesthetics
- Each promptValue should be a concise English phrase (3-8 words) describing the decoration for an AI image generator

Return ONLY a JSON array, no other text:
[{"label_en":"English name","label_ru":"Russian name","label_ka":"Georgian name","promptValue":"concise english prompt phrase"}]`;

    try {
      logger.info({ niche }, 'Generating decoration suggestions via Gemini (live fallback)');

      const response = await gemini.models.generateContent({
        model: env.GEMINI_TEXT_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseModalities: ['Text'] },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new InternalError('Gemini returned no candidates');
      }

      const textPart = candidates[0].content?.parts?.find((p: { text?: string }) => p.text);
      if (!textPart?.text) {
        throw new InternalError('Gemini returned no text');
      }

      let jsonStr = textPart.text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr) as GeneratedDecoration[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new InternalError('Invalid decoration suggestions format');
      }

      const valid = parsed
        .filter(d => d.label_en && d.promptValue)
        .slice(0, 6)
        .map(d => ({
          label_en: String(d.label_en).slice(0, 50),
          label_ru: String(d.label_ru || d.label_en).slice(0, 50),
          label_ka: String(d.label_ka || d.label_en).slice(0, 50),
          promptValue: String(d.promptValue).slice(0, 100),
        }));

      logger.info({ niche, count: valid.length }, 'Decoration suggestions generated (live)');
      return valid;
    } catch (err: unknown) {
      if (err instanceof InternalError) throw err;

      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        logger.warn({ err }, 'Gemini rate limit during decoration suggestions');
        throw new InternalError('Suggestion generation temporarily unavailable');
      }

      logger.error({ err }, 'Decoration suggestion generation error');
      throw new InternalError('Failed to generate decoration suggestions');
    }
  },

  async generateBatch(niche: string, count: number = POOL_TARGET): Promise<number> {
    const { getGeminiClient } = await import('../../libs/gemini.js');
    const gemini = getGeminiClient();
    const context = NICHE_CONTEXT[niche] ?? NICHE_CONTEXT.general;

    let totalInserted = 0;
    const iterations = Math.ceil(count / BATCH_SIZE);

    for (let i = 0; i < iterations; i++) {
      const batchCount = Math.min(BATCH_SIZE, count - totalInserted);

      const prompt = `You are a creative beauty photo decoration expert. Generate ${batchCount} unique, creative decorative element ideas for beauty photos in the "${niche}" category (${context}).

These decorations will be digitally added to beauty photos. Think of beautiful, photogenic objects like flowers, crystals, light effects, nature elements, luxury items, etc.

Requirements:
- Each idea should be visually stunning and work well in beauty photography
- Avoid generic/common ideas like "roses" or "butterflies" — be creative and specific
- Ideas should be tasteful and elegant, matching luxury beauty aesthetics
- Each promptValue should be a concise English phrase (3-8 words) describing the decoration for an AI image generator
- Make every idea DIFFERENT from common suggestions — be wildly creative

Return ONLY a JSON array, no other text:
[{"label_en":"English name","label_ru":"Russian name","label_ka":"Georgian name","promptValue":"concise english prompt phrase"}]`;

      try {
        const response = await gemini.models.generateContent({
          model: env.GEMINI_TEXT_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseModalities: ['Text'] },
        });

        const candidates = response.candidates;
        if (!candidates?.[0]?.content?.parts) continue;

        const textPart = candidates[0].content.parts.find((p: { text?: string }) => p.text);
        if (!textPart?.text) continue;

        let jsonStr = textPart.text.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr) as GeneratedDecoration[];
        if (!Array.isArray(parsed)) continue;

        const valid = parsed
          .filter(d => d.label_en && d.promptValue)
          .slice(0, batchCount)
          .map(d => ({
            niche,
            labelEn: String(d.label_en).slice(0, 80),
            labelRu: String(d.label_ru || d.label_en).slice(0, 80),
            labelKa: String(d.label_ka || d.label_en).slice(0, 80),
            promptValue: String(d.promptValue).slice(0, 150),
          }));

        const inserted = await decorationsRepo.insertMany(valid);
        totalInserted += inserted;

        logger.info({ niche, batch: i + 1, inserted, totalInserted }, 'Decoration batch inserted');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          logger.warn({ niche, batch: i + 1 }, 'Gemini rate limit during batch generation, stopping');
          break;
        }
        logger.error({ err, niche, batch: i + 1 }, 'Decoration batch generation error');
      }
    }

    const currentCount = await decorationsRepo.countByNiche(niche);
    if (currentCount > POOL_MAX) {
      const deleted = await decorationsRepo.deleteOldestByNiche(niche, POOL_TARGET);
      logger.info({ niche, deleted, kept: POOL_TARGET }, 'Trimmed decoration pool');
    }

    return totalInserted;
  },

  async replenishAllNiches(): Promise<void> {
    logger.info('Starting decoration suggestion replenishment for all niches');

    for (const niche of VALID_NICHES) {
      const currentCount = await decorationsRepo.countByNiche(niche);
      const needed = POOL_TARGET - currentCount;

      if (needed <= 0) {
        logger.info({ niche, currentCount }, 'Pool already full, skipping');
        continue;
      }

      logger.info({ niche, currentCount, needed }, 'Replenishing decoration pool');
      const inserted = await this.generateBatch(niche, needed);
      logger.info({ niche, inserted }, 'Decoration pool replenished');

      // Small delay between niches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('Decoration suggestion replenishment complete');
  },
};
