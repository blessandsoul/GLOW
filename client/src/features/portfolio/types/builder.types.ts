export type BuilderSection = 'about' | 'services' | 'gallery' | 'preview';

export interface JobResultImage {
    jobId: string;
    imageUrl: string;
    variantIndex: number;
    createdAt: string;
}

export interface ReorderPayload {
    items: { id: string; sortOrder: number }[];
}

export interface CompletionCriteria {
    hasName: boolean;
    hasCity: boolean;
    hasNiche: boolean;
    hasBio: boolean;
    hasService: boolean;
    hasMinImages: boolean;
}

export interface SectionConfig {
    id: BuilderSection;
    labelKey: string;
    isComplete: boolean;
}
