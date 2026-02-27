export interface FilterCategory {
  id: string;
  label_ka: string;
  label_ru: string;
  label_en: string;
  icon: string;
  count: number;
  coverUrl?: string;
}

export interface FilterSubcategory {
  id: string;
  categoryId: string;
  label_ka: string;
  label_ru: string;
  label_en: string;
  icon: string;
  count: number;
  sortOrder: number;
}

export interface Filter {
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

export interface FiltersData {
  categories: FilterCategory[];
  subcategories: FilterSubcategory[];
  filters: Filter[];
}
