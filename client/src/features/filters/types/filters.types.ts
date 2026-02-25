export interface FilterCategory {
  id: string;
  label_ka: string;
  label_ru: string;
  icon: string;
  count: number;
  coverUrl?: string;
}

export interface Filter {
  id: string;
  categoryId: string;
  name_ka: string;
  name_ru: string;
  previewUrl: string;
  beforeUrl?: string;
  description_ka: string;
  description_ru: string;
  isPopular: boolean;
}

export interface FiltersData {
  categories: FilterCategory[];
  filters: Filter[];
}
