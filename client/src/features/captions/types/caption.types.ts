export type CaptionVariant = 'SELLING' | 'INFORMATIONAL' | 'CASUAL';
export type CaptionLanguage = 'RU' | 'EN' | 'KA';

export interface Caption {
    id: string;
    jobId: string;
    variant: CaptionVariant;
    language: CaptionLanguage;
    text: string;
    hashtags: string;
    createdAt: string;
}

export const VARIANT_LABELS: Record<
    CaptionVariant,
    { label: string; description: string; emoji: string }
> = {
    SELLING: {
        label: 'system.sys_2px1vo',
        description: 'system.sys_1cosfm',
        emoji: '💰',
    },
    INFORMATIONAL: {
        label: 'system.sys_9klrsj',
        description: 'system.sys_klh0t1',
        emoji: '📋',
    },
    CASUAL: {
        label: 'Casual',
        description: 'system.sys_5wh2s2',
        emoji: '✨',
    },
};

export const LANGUAGES: Record<
    CaptionLanguage,
    { label: string; nativeLabel: string; flag: string }
> = {
    RU: { label: 'system.sys_kif3ln', nativeLabel: 'system.sys_kif3ln', flag: '🇷🇺' },
    EN: { label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
    KA: { label: 'Georgian', nativeLabel: 'ქართული', flag: '🇬🇪' },
};

export const DEFAULT_LANGUAGES: CaptionLanguage[] = ['RU', 'EN'];
