export type OutputFormat = 'carousel' | 'stories' | 'both';

export interface BeforeAfterSettings {
    outputFormat: OutputFormat;
    enhanceBefore: boolean;
    enhanceAfter: boolean;
}

export const DEFAULT_BA_SETTINGS: BeforeAfterSettings = {
    outputFormat: 'both',
    enhanceBefore: true,
    enhanceAfter: true,
};

export interface BeforeAfterJob {
    id: string;
    userId: string | null;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    mode: 'BEFORE_AFTER';
    beforeUrl: string;
    afterUrl: string;
    results: BeforeAfterResults | null;
    settings?: BeforeAfterSettings;
    createdAt: string;
}

export interface BeforeAfterResults {
    carousel: string[];
    stories: string[];
}
