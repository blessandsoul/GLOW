import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

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
          .map(id => variable.options.find(o => o.id === id)?.value)
          .filter((v): v is string => !!v && v.length > 0);
        resolved = resolved.replace(placeholder, selectedValues.join('. '));
      } else {
        // Single select: find the option value by id
        const selectedId = typeof userValue === 'string' ? userValue : '';
        const option = variable.options.find(o => o.id === selectedId);
        const value = option?.value ?? '';
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
};
