import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';

export interface GeneratedVariableOption {
  label_en: string;
  label_ru: string;
  label_ka: string;
  promptValue: string;
}

interface SuggestVariablesRequest {
  variableId: string;
  variableLabel: string;
  masterPromptId: string;
  existingOptions: string[];
}

class FiltersService {
  async suggestVariableOptions(params: SuggestVariablesRequest): Promise<GeneratedVariableOption[]> {
    const { data } = await apiClient.post<ApiResponse<GeneratedVariableOption[]>>(
      API_ENDPOINTS.FILTERS.SUGGEST_VARIABLES,
      params,
    );
    return data.data;
  }
}

export const filtersService = new FiltersService();
