export interface FilterCategory {
  id: string;
  label_ka: string;
  label_ru: string;
  icon: string;
  count: number;
}

export interface Filter {
  id: string;
  categoryId: string;
  name_ka: string;
  name_ru: string;
  prompt: string;
}

export interface FiltersData {
  categories: FilterCategory[];
  filters: Filter[];
}
