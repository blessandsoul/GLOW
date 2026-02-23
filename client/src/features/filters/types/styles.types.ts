import type { PhotoSettings } from '@/features/upload/types/upload.types';

export interface StyleBase {
  id: string;
  categoryId: string;
  name_ka: string;
  name_ru: string;
  previewUrl: string;
  description_ka: string;
  description_ru: string;
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
  icon: string;
  count: number;
  sortOrder?: number;
}

export interface StylesData {
  categories: StyleCategory[];
  styles: Style[];
}
