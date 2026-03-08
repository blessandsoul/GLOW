import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { env } from '@/config/env.js';
import { logger } from '../../libs/logger.js';
import { InternalError } from '../../shared/errors/errors.js';
import { filtersRepo } from './filters.repo.js';

interface FilterEntry {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  name_ka: string;
  name_ru: string;
  name_en: string;
  prompt: string;
  previewUrl: string;
  beforeUrl?: string;
  description_ka: string;
  description_ru: string;
  description_en: string;
  isPopular: boolean;
}

interface FilterMetadata {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  name_ka: string;
  name_ru: string;
  name_en: string;
  previewUrl: string;
  beforeUrl?: string;
  description_ka: string;
  description_ru: string;
  description_en: string;
  isPopular: boolean;
}

interface FilterCategory {
  id: string;
  label_ka: string;
  label_ru: string;
  label_en: string;
  icon: string;
  count: number;
  sortOrder?: number;
}

interface FilterSubcategory {
  id: string;
  categoryId: string;
  label_ka: string;
  label_ru: string;
  label_en: string;
  icon: string;
  count: number;
  sortOrder: number;
}

interface VariableOption {
  id: string;
  value: string;
  label_en: string;
  label_ru: string;
  label_ka: string;
}

interface PromptVariable {
  id: string;
  type: 'select' | 'multi-select';
  label_en: string;
  label_ru: string;
  label_ka: string;
  required?: boolean;
  default: string | string[];
  options: VariableOption[];
}

interface MasterPromptEntry {
  id: string;
  categoryId: string;
  name_en: string;
  name_ru: string;
  name_ka: string;
  description_en: string;
  description_ru: string;
  description_ka: string;
  previewUrl: string;
  prompt: string;
  sortOrder: number;
  variables: PromptVariable[];
}

interface PromptsData {
  categories: FilterCategory[];
  subcategories: FilterSubcategory[];
  filters: FilterEntry[];
  masterPrompts?: MasterPromptEntry[];
}

// Load prompts once at startup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, 'data', 'prompts.json');
const rawData = readFileSync(dataPath, 'utf-8');
const promptsData: PromptsData = JSON.parse(rawData);

// Build lookup map for fast prompt retrieval
const promptMap = new Map<string, string>();
for (const filter of promptsData.filters) {
  promptMap.set(filter.id, filter.prompt);
}

// Build master prompt lookup map
const masterPromptMap = new Map<string, MasterPromptEntry>();
if (promptsData.masterPrompts) {
  for (const mp of promptsData.masterPrompts) {
    masterPromptMap.set(mp.id, mp);
  }
}

// Pre-build metadata (without prompts) for the public API
const metadataFilters: FilterMetadata[] = promptsData.filters.map(
  ({ id, categoryId, subcategoryId, name_ka, name_ru, name_en, previewUrl, beforeUrl, description_ka, description_ru, description_en, isPopular }) => ({
    id,
    categoryId,
    ...(subcategoryId && { subcategoryId }),
    name_ka,
    name_ru,
    name_en,
    previewUrl,
    ...(beforeUrl && { beforeUrl }),
    description_ka,
    description_ru,
    description_en,
    isPopular,
  })
);

export const filtersService = {
  /**
   * Look up a prompt by filter ID. Internal use only — never expose via HTTP.
   * Works for both regular filters and master prompts (with default variables).
   */
  getPromptById(filterId: string): string | null {
    // Check regular filters first
    const regularPrompt = promptMap.get(filterId);
    if (regularPrompt) return regularPrompt;

    // Check master prompts — resolve with defaults
    const master = masterPromptMap.get(filterId);
    if (master) {
      return this.resolvePrompt(filterId, {});
    }

    return null;
  },

  /**
   * Resolve a master prompt by substituting variable values into the template.
   * If a variable is not provided, uses the default value.
   * For regular filters, returns the prompt as-is (ignores variables).
   */
  resolvePrompt(filterId: string, variables: Record<string, string | string[]>): string | null {
    // Regular filter — return as-is
    const regularPrompt = promptMap.get(filterId);
    if (regularPrompt) return regularPrompt;

    // Master prompt — substitute variables
    const master = masterPromptMap.get(filterId);
    if (!master) return null;

    let resolved = master.prompt;

    for (const variable of master.variables) {
      const placeholder = `[${variable.id}]`;
      let userValue = variables[variable.id];

      // Use default if not provided
      if (userValue === undefined || userValue === null) {
        userValue = variable.default;
      }

      if (variable.type === 'multi-select') {
        // Multi-select: combine values of selected options
        const selectedIds = Array.isArray(userValue) ? userValue : [];
        const selectedValues = selectedIds
          .map(id => {
            const opt = variable.options.find(o => o.id === id);
            // If option not found, treat the id as a custom AI-generated prompt value
            return opt?.value ?? (id.length > 0 ? id : undefined);
          })
          .filter((v): v is string => !!v && v.length > 0);
        resolved = resolved.replace(placeholder, selectedValues.join('. '));
      } else {
        // Single select: find the option value by id
        const selectedId = typeof userValue === 'string' ? userValue : '';
        const option = variable.options.find(o => o.id === selectedId);
        // If option not found, treat the id as a custom AI-generated prompt value
        const value = option?.value ?? (selectedId.length > 0 ? selectedId : '');
        resolved = resolved.replace(placeholder, value);
      }
    }

    return resolved;
  },

  /**
   * Return filter metadata WITHOUT prompts. Safe for public API.
   */
  getMetadata(): { categories: FilterCategory[]; subcategories: FilterSubcategory[]; filters: FilterMetadata[] } {
    return {
      categories: promptsData.categories,
      subcategories: promptsData.subcategories,
      filters: metadataFilters,
    };
  },

  /**
   * Get variable option suggestions — fast path from pool, fallback to live Gemini.
   */
  async suggestVariableOptions(input: {
    variableId: string;
    variableLabel: string;
    masterPromptId: string;
    existingOptions: string[];
  }): Promise<GeneratedVariableOption[]> {
    const { variableId } = input;
    const poolCount = await filtersRepo.countByVariable(variableId);

    if (poolCount >= VAR_MIN_POOL_THRESHOLD) {
      // FAST PATH: serve from pre-generated pool
      const rows = await filtersRepo.getRandomByVariable(variableId, VAR_SERVE_COUNT);
      return rows.map(r => ({
        label_en: r.labelEn,
        label_ru: r.labelRu,
        label_ka: r.labelKa,
        promptValue: r.promptValue,
      }));
    }

    // FALLBACK: generate live
    logger.warn({ variableId, poolCount }, 'Variable pool low, falling back to live Gemini');
    return this.suggestVariableOptionsLive(input);
  },

  /**
   * Live Gemini generation for variable options (slow path).
   */
  async suggestVariableOptionsLive(input: {
    variableId: string;
    variableLabel: string;
    masterPromptId: string;
    existingOptions: string[];
  }): Promise<GeneratedVariableOption[]> {
    const { getGeminiClient } = await import('../../libs/gemini.js');
    const gemini = getGeminiClient();

    const { variableId, variableLabel, masterPromptId, existingOptions } = input;

    const master = masterPromptMap.get(masterPromptId);
    const variable = master?.variables.find(v => v.id === variableId);

    const variableContext = VARIABLE_CONTEXT[variableId] ?? `creative options for "${variableLabel}" in beauty photography`;
    const existingList = existingOptions.length > 0
      ? `\nAlready existing options (generate DIFFERENT ones): ${existingOptions.join(', ')}`
      : '';

    const exampleValues = variable?.options
      .filter(o => o.id !== 'none' && o.value.length > 0)
      .slice(0, 2)
      .map(o => o.value) ?? [];

    const exampleRef = exampleValues.length > 0
      ? `\n\nHere are example prompt values for reference style (generate similar quality but DIFFERENT ideas):\n${exampleValues.map(v => `- "${v.substring(0, 120)}"`).join('\n')}`
      : '';

    const prompt = `You are a creative beauty photography prompt expert. Generate ${VAR_SERVE_COUNT} unique, creative "${variableLabel}" options for beauty portrait retouching/editing.

Context: ${variableContext}${existingList}${exampleRef}

Requirements:
- Each idea must be visually stunning and work well as a ${variableLabel.toLowerCase()} for beauty photography
- Be creative and specific — avoid generic/obvious ideas
- Match luxury beauty / editorial aesthetic
- promptValue must be a detailed English prompt phrase (15-40 words) describing the ${variableLabel.toLowerCase()} for an AI image generator — specific enough to produce consistent results
- Labels should be short human-readable names (2-5 words)

Return ONLY a JSON array, no other text:
[{"label_en":"English name","label_ru":"Russian name","label_ka":"Georgian name","promptValue":"detailed english prompt phrase for AI image generator"}]`;

    try {
      logger.info({ variableId, masterPromptId }, 'Generating variable suggestions via Gemini (live)');

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

      const parsed = JSON.parse(jsonStr) as GeneratedVariableOption[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new InternalError('Invalid variable suggestions format');
      }

      const valid = parsed
        .filter(d => d.label_en && d.promptValue)
        .slice(0, VAR_SERVE_COUNT)
        .map(d => ({
          label_en: String(d.label_en).slice(0, 50),
          label_ru: String(d.label_ru || d.label_en).slice(0, 50),
          label_ka: String(d.label_ka || d.label_en).slice(0, 50),
          promptValue: String(d.promptValue).slice(0, 200),
        }));

      logger.info({ variableId, count: valid.length }, 'Variable suggestions generated (live)');
      return valid;
    } catch (err: unknown) {
      if (err instanceof InternalError) throw err;

      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        logger.warn({ err }, 'Gemini rate limit during variable suggestions');
        throw new InternalError('Suggestion generation temporarily unavailable');
      }

      logger.error({ err }, 'Variable suggestion generation error');
      throw new InternalError('Failed to generate variable suggestions');
    }
  },

  /**
   * Generate a batch of variable suggestions and store in pool.
   */
  async generateVariableBatch(variableId: string, count: number = VAR_POOL_TARGET): Promise<number> {
    const { getGeminiClient } = await import('../../libs/gemini.js');
    const gemini = getGeminiClient();

    const variableLabel = VARIABLE_LABELS[variableId] ?? variableId;
    const variableContext = VARIABLE_CONTEXT[variableId] ?? `creative options for "${variableLabel}" in beauty photography`;

    // Get example prompt values from any master prompt that has this variable
    let exampleRef = '';
    for (const [, master] of masterPromptMap) {
      const variable = master.variables.find(v => v.id === variableId);
      if (variable) {
        const examples = variable.options
          .filter(o => o.id !== 'none' && o.value.length > 0)
          .slice(0, 2)
          .map(o => o.value);
        if (examples.length > 0) {
          exampleRef = `\n\nHere are example prompt values for reference style (generate similar quality but DIFFERENT ideas):\n${examples.map(v => `- "${v.substring(0, 120)}"`).join('\n')}`;
        }
        break;
      }
    }

    let totalInserted = 0;
    const iterations = Math.ceil(count / VAR_BATCH_SIZE);

    for (let i = 0; i < iterations; i++) {
      const batchCount = Math.min(VAR_BATCH_SIZE, count - totalInserted);

      const prompt = `You are a creative beauty photography prompt expert. Generate ${batchCount} unique, creative "${variableLabel}" options for beauty portrait retouching/editing.

Context: ${variableContext}${exampleRef}

Requirements:
- Each idea must be visually stunning and work well as a ${variableLabel.toLowerCase()} for beauty photography
- Be creative and specific — avoid generic/obvious ideas
- Match luxury beauty / editorial aesthetic
- promptValue must be a detailed English prompt phrase (15-40 words) describing the ${variableLabel.toLowerCase()} for an AI image generator — specific enough to produce consistent results
- Labels should be short human-readable names (2-5 words)
- Make every idea DIFFERENT from common suggestions — be wildly creative

Return ONLY a JSON array, no other text:
[{"label_en":"English name","label_ru":"Russian name","label_ka":"Georgian name","promptValue":"detailed english prompt phrase for AI image generator"}]`;

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

        const parsed = JSON.parse(jsonStr) as GeneratedVariableOption[];
        if (!Array.isArray(parsed)) continue;

        const valid = parsed
          .filter(d => d.label_en && d.promptValue)
          .slice(0, batchCount)
          .map(d => ({
            variableId,
            labelEn: String(d.label_en).slice(0, 80),
            labelRu: String(d.label_ru || d.label_en).slice(0, 80),
            labelKa: String(d.label_ka || d.label_en).slice(0, 80),
            promptValue: String(d.promptValue).slice(0, 250),
          }));

        const inserted = await filtersRepo.insertMany(valid);
        totalInserted += inserted;

        logger.info({ variableId, batch: i + 1, inserted, totalInserted }, 'Variable batch inserted');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          logger.warn({ variableId, batch: i + 1 }, 'Gemini rate limit during batch, stopping');
          break;
        }
        logger.error({ err, variableId, batch: i + 1 }, 'Variable batch generation error');
      }
    }

    return totalInserted;
  },

  /**
   * Replenish variable suggestion pools for all variable types.
   */
  async replenishAllVariables(): Promise<void> {
    logger.info('Starting variable suggestion replenishment for all variable types');

    for (const variableId of VALID_VARIABLE_IDS) {
      const currentCount = await filtersRepo.countByVariable(variableId);

      // Fill up to target, or add a small batch if already at target to grow diversity
      const deficit = VAR_POOL_TARGET - currentCount;
      const batchSize = deficit > 0 ? deficit : VAR_REPLENISH_BATCH;

      logger.info({ variableId, currentCount, adding: batchSize }, 'Replenishing variable pool');
      const inserted = await this.generateVariableBatch(variableId, batchSize);
      logger.info({ variableId, inserted, totalNow: currentCount + inserted }, 'Variable pool replenished');

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('Variable suggestion replenishment complete');
  },
};

export interface GeneratedVariableOption {
  label_en: string;
  label_ru: string;
  label_ka: string;
  promptValue: string;
}

const VAR_POOL_TARGET = 50;
const VAR_BATCH_SIZE = 10;
const VAR_SERVE_COUNT = 6;
const VAR_MIN_POOL_THRESHOLD = 6;
const VAR_REPLENISH_BATCH = 10;

const VALID_VARIABLE_IDS = ['BACKGROUND', 'EYE_EFFECT', 'LIP_DECOR', 'HAND_ACCESSORY', 'SKIN_FINISH', 'EXTRAS'];

const VARIABLE_CONTEXT: Record<string, string> = {
  BACKGROUND: 'studio/scene backgrounds for beauty portrait photography — colors, textures, gradients, settings',
  EYE_EFFECT: 'special effects and enhancements for eye area in beauty portraits — shimmer, glow, color, focus',
  LIP_DECOR: 'creative lip decoration and effects for beauty portraits — textures, finishes, artistic elements',
  HAND_ACCESSORY: 'hand/nail accessories and decorative elements for manicure photography — jewelry, props, styling',
  SKIN_FINISH: 'skin finish and texture effects for beauty retouching — glow, matte, dewy, editorial looks',
  EXTRAS: 'additional special effects for beauty photography — lighting, texture overlays, atmospheric elements',
  HAIR_STYLE: 'hairstyle and haircut options for hair transformation portraits — cuts, styles, updos, braids, modern and classic',
  HAIR_COLOR: 'hair color options for hair transformation — natural shades, fashion colors, highlights, balayage, ombre techniques',
  HAIR_LENGTH: 'hair length options for transformation — short to extra long',
  HAIR_TEXTURE: 'hair texture and finish options — straight, wavy, curly, voluminous, wet-look styling',
};

const VARIABLE_LABELS: Record<string, string> = {
  BACKGROUND: 'Background',
  EYE_EFFECT: 'Eye Effect',
  LIP_DECOR: 'Lip Decor',
  HAND_ACCESSORY: 'Hand Accessory',
  SKIN_FINISH: 'Skin Finish',
  EXTRAS: 'Extra Effects',
};
