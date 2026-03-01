import { env } from '@/config/env.js';
import { logger } from '../../libs/logger.js';
import { InternalError } from '../../shared/errors/errors.js';

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

export const decorationsService = {
  async suggestDecorations(niche: string): Promise<GeneratedDecoration[]> {
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
      logger.info({ niche }, 'Generating decoration suggestions via Gemini');

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

      // Validate and sanitize each item
      const valid = parsed
        .filter(d => d.label_en && d.promptValue)
        .slice(0, 6)
        .map(d => ({
          label_en: String(d.label_en).slice(0, 50),
          label_ru: String(d.label_ru || d.label_en).slice(0, 50),
          label_ka: String(d.label_ka || d.label_en).slice(0, 50),
          promptValue: String(d.promptValue).slice(0, 100),
        }));

      logger.info({ niche, count: valid.length }, 'Decoration suggestions generated');
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
};
