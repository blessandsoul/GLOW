export interface TrendTemplate {
    id: string;
    title: string;
    description: string | null;
    previewUrl: string;
    settings: Record<string, unknown>;
    weekOf: string;
    isFree: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
}
