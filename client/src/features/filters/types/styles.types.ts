import type { PhotoSettings } from '@/features/upload/types/upload.types';

export interface StyleBase {
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

export interface FilterStyle extends StyleBase {
  kind: 'filter';
}

export interface PresetStyle extends StyleBase {
  kind: 'preset';
  settings: PhotoSettings;
}

export type Style = FilterStyle | PresetStyle;

export interface StyleCategory {
  id: string;
  label_ka: string;
  label_ru: string;
  label_en: string;
  icon: string;
  count: number;
  sortOrder?: number;
  coverUrl?: string;
}

export interface StyleSubcategory {
  id: string;
  categoryId: string;
  label_ka: string;
  label_ru: string;
  label_en: string;
  icon: string;
  count: number;
  sortOrder: number;
}

export interface VariableOption {
  id: string;
  label_en: string;
  label_ru: string;
  label_ka: string;
}

export interface PromptVariable {
  id: string;
  type: 'select' | 'multi-select';
  label_en: string;
  label_ru: string;
  label_ka: string;
  required?: boolean;
  default: string | string[];
  options: VariableOption[];
}

export interface MasterPrompt {
  id: string;
  categoryId: string;
  name_en: string;
  name_ru: string;
  name_ka: string;
  description_en: string;
  description_ru: string;
  description_ka: string;
  previewUrl: string;
  sortOrder: number;
  variables: PromptVariable[];
}

export type PromptVariableValues = Record<string, string | string[]>;

export interface StylesData {
  categories: StyleCategory[];
  subcategories: StyleSubcategory[];
  styles: Style[];
  masterPrompts: MasterPrompt[];
}
