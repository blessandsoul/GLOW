import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

interface FilterEntry {
  id: string;
  categoryId: string;
  name_ka: string;
  name_ru: string;
  prompt: string;
  previewUrl: string;
  description_ka: string;
  description_ru: string;
  isPopular: boolean;
}

interface FilterMetadata {
  id: string;
  categoryId: string;
  name_ka: string;
  name_ru: string;
  previewUrl: string;
  description_ka: string;
  description_ru: string;
  isPopular: boolean;
}

interface FilterCategory {
  id: string;
  label_ka: string;
  label_ru: string;
  icon: string;
  count: number;
  sortOrder?: number;
}

interface PromptsData {
  categories: FilterCategory[];
  filters: FilterEntry[];
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

// Pre-build metadata (without prompts) for the public API
const metadataFilters: FilterMetadata[] = promptsData.filters.map(
  ({ id, categoryId, name_ka, name_ru, previewUrl, description_ka, description_ru, isPopular }) => ({
    id,
    categoryId,
    name_ka,
    name_ru,
    previewUrl,
    description_ka,
    description_ru,
    isPopular,
  })
);

export const filtersService = {
  /**
   * Look up a prompt by filter ID. Internal use only — never expose via HTTP.
   */
  getPromptById(filterId: string): string | null {
    return promptMap.get(filterId) ?? null;
  },

  /**
   * Return filter metadata WITHOUT prompts. Safe for public API.
   */
  getMetadata(): { categories: FilterCategory[]; filters: FilterMetadata[] } {
    return {
      categories: promptsData.categories,
      filters: metadataFilters,
    };
  },
};
