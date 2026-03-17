import { catalogRepo } from './catalog.repo.js';

export function createCatalogService() {
  return {
    async getSpecialities() {
      return catalogRepo.findActiveSpecialities();
    },

    async getServiceCategories() {
      const categories = await catalogRepo.findActiveServiceCategories();
      return categories.map((cat) => ({
        id: cat.slug,
        label: cat.label,
        icon: cat.icon,
        suggestions: cat.suggestions.map((s) => s.name),
      }));
    },

    async getDistricts(citySlug?: string) {
      return catalogRepo.findActiveDistricts(citySlug);
    },

    async getBrands() {
      return catalogRepo.findActiveBrands();
    },

    async getStyleTags(niche?: string) {
      return catalogRepo.findActiveStyleTags(niche);
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
